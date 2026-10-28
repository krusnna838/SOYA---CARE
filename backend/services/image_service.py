import io
import base64
import logging
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

def detect_image_magic(raw_bytes: bytes) -> str:
    """Detect image format by signature headers instead of trusting file extension."""
    if len(raw_bytes) < 12:
        return ""
    if raw_bytes[:3] == b"\xff\xd8\xff":
        return "JPEG"
    if raw_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "PNG"
    if raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP":
        return "WEBP"
    return ""

def validate_and_process_image(file_storage=None, base64_str=None):
    """
    STAGE A: Image Validation Pipeline
    1. Read and validate raw bytes (format signature, size limits).
    2. Check image integrity using PIL verify().
    3. Auto-correct EXIF orientation tags (common in smartphone camera photos).
    4. Normalize color space to RGB.
    5. Resize large images cleanly without distorting aspect ratio.
    6. Generate optimized inference buffer and compact UI/PDF thumbnail.
    """
    raw_bytes = None

    if file_storage and getattr(file_storage, "filename", None):
        raw_bytes = file_storage.read()
    elif isinstance(base64_str, str) and base64_str.strip():
        clean_str = base64_str.strip()
        if clean_str.startswith("data:"):
            try:
                header, clean_str = clean_str.split(",", 1)
                if ";base64" not in header.lower():
                    raise ValueError("Data URL must be base64-encoded.")
            except ValueError as e:
                raise ValueError("Malformed image data URL.") from e
        try:
            raw_bytes = base64.b64decode(clean_str, validate=True)
        except Exception as e:
            raise ValueError("The provided base64 image data is corrupted or invalid.") from e
    else:
        raise ValueError("No image provided. Please select a file or capture a photo.")

    if not raw_bytes:
        raise ValueError("Uploaded image is empty (0 bytes).")

    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise ValueError(f"Image exceeds maximum size limit of 10 MB ({len(raw_bytes)/(1024*1024):.1f} MB).")

    # Validate Magic Bytes
    detected_fmt = detect_image_magic(raw_bytes)
    if not detected_fmt:
        # Fallback test with PIL open
        try:
            with Image.open(io.BytesIO(raw_bytes)) as test_im:
                detected_fmt = test_im.format
        except Exception as e:
            raise ValueError("Unsupported or corrupted image file. Please upload a JPG, PNG, or WEBP image.") from e

    # Integrity verification
    try:
        with Image.open(io.BytesIO(raw_bytes)) as test_im:
            test_im.verify()
    except Exception as e:
        raise ValueError("Image file is corrupted and could not be decoded.") from e

    # Process and Normalize Image
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            # Auto-orient phone camera photos according to EXIF tags
            img = ImageOps.exif_transpose(img)
            
            # Convert to RGB (handles RGBA, Palette, Grayscale, CMYK)
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Preserve aspect ratio while constraining maximum dimension to 2048px
            img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)

            # Generate high-quality inference JPEG buffer
            inference_buffer = io.BytesIO()
            img.save(inference_buffer, format="JPEG", quality=90, optimize=True)
            inference_buffer.seek(0)

            # Generate compact thumbnail for database & PDF report (max 400x400)
            thumb = img.copy()
            thumb.thumbnail((400, 400), Image.Resampling.LANCZOS)
            thumb_buffer = io.BytesIO()
            thumb.save(thumb_buffer, format="JPEG", quality=80, optimize=True)
            thumb_buffer.seek(0)
            thumbnail_b64 = "data:image/jpeg;base64," + base64.b64encode(thumb_buffer.getvalue()).decode("ascii")

            dimensions = {"width": img.width, "height": img.height, "format": detected_fmt}

            return {
                "inference_buffer": inference_buffer,
                "thumbnail_b64": thumbnail_b64,
                "dimensions": dimensions,
                "size_bytes": len(raw_bytes)
            }
    except Exception as e:
        logger.exception("Image normalization failed")
        raise ValueError(f"Could not process image: {str(e)}") from e
