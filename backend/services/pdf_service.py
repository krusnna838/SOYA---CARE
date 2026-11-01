import io
import base64
import logging

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage,
)

logger = logging.getLogger(__name__)


def esc(text: any) -> str:
    """Escape XML special characters for ReportLab Paragraphs."""
    return str(text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _draw_brand_page(canvas, doc):
    """Premium SOYA-CARE stationery: subtle watermark, brand rails and page footer."""
    canvas.saveState()
    page_w, page_h = A4

    # Slim branded top rail and a restrained gold accent.
    canvas.setFillColor(colors.HexColor("#064e3b"))
    canvas.rect(0, page_h - 5 * mm, page_w, 5 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#b7c93d"))
    canvas.rect(0, page_h - 6.1 * mm, page_w, 1.1 * mm, stroke=0, fill=1)

    # Very light, diagonal wordmark watermark (kept behind readable content).
    try:
        canvas.setFillAlpha(0.055)
    except Exception:
        pass
    canvas.saveState()
    canvas.translate(page_w / 2, page_h / 2)
    canvas.rotate(32)
    canvas.setFillColor(colors.HexColor("#0b7653"))
    canvas.setFont("Helvetica-Bold", 42)
    canvas.drawCentredString(0, 0, "SOYA-CARE")
    canvas.restoreState()

    # Footer separator and report pagination.
    canvas.setStrokeColor(colors.HexColor("#d7e8df"))
    canvas.setLineWidth(0.7)
    canvas.line(16 * mm, 14 * mm, page_w - 16 * mm, 14 * mm)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.setFont("Helvetica", 7)
    canvas.drawString(16 * mm, 9 * mm, "SOYA-CARE  |  AI-powered soybean health advisory")
    canvas.drawRightString(page_w - 16 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def generate_pdf_report(report_data: dict, farmer_info: dict = None) -> io.BytesIO:
    """
    Generate a branded A4 SOYA-CARE diagnostic report.
    The report data, diagnosis and recommendations are preserved; only presentation
    and PDF stationery are styled here.
    """
    farmer_info = farmer_info or {}
    output = io.BytesIO()

    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="SOYA-CARE Crop Health Report",
        author="SOYA-CARE",
        subject="AI-assisted soybean health analysis and agronomic advisory",
    )

    styles = getSampleStyleSheet()

    PRIMARY_GREEN = colors.HexColor("#064e3b")
    ACCENT_GREEN = colors.HexColor("#0f9f6e")
    BG_LIGHT_GREEN = colors.HexColor("#f0fdf4")
    BORDER_GREEN = colors.HexColor("#c5e6d3")
    TEXT_MUTED = colors.HexColor("#526273")
    TEXT_DARK = colors.HexColor("#17231e")
    ALERT_BG = colors.HexColor("#fff9e9")
    ALERT_BORDER = colors.HexColor("#f2d58a")

    title_style = ParagraphStyle(
        "DocTitle", parent=styles["Title"], fontName="Helvetica-Bold",
        fontSize=23, leading=27, textColor=PRIMARY_GREEN,
        alignment=TA_LEFT, spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle", parent=styles["Normal"], fontName="Helvetica-Bold",
        fontSize=8, leading=11, textColor=ACCENT_GREEN,
        alignment=TA_LEFT, spaceAfter=10,
    )
    section_heading = ParagraphStyle(
        "SectionHeading", parent=styles["Heading2"], fontName="Helvetica-Bold",
        fontSize=11, leading=14, textColor=PRIMARY_GREEN,
        spaceBefore=11, spaceAfter=5, keepWithNext=True,
    )
    body_style = ParagraphStyle(
        "BodyDark", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=8.8, leading=13, textColor=TEXT_DARK,
    )
    body_bold = ParagraphStyle(
        "BodyBold", parent=body_style, fontName="Helvetica-Bold",
    )
    bullet_style = ParagraphStyle(
        "BulletItem", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=8.4, leading=12, textColor=TEXT_DARK,
        leftIndent=12, firstLineIndent=-7, spaceAfter=3,
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerText", parent=styles["BodyText"], fontName="Helvetica-Oblique",
        fontSize=7.2, leading=10, textColor=colors.HexColor("#80551a"),
    )

    story = []

    # 1. Premium branded report masthead.
    meta_right = ParagraphStyle(
        "MetaRight", parent=styles["Normal"], alignment=TA_RIGHT,
        fontSize=8, leading=12, textColor=TEXT_MUTED,
    )
    status_style = ParagraphStyle(
        "StatusTag", parent=styles["Normal"], alignment=TA_RIGHT,
        fontSize=7, leading=9, fontName="Helvetica-Bold", textColor=PRIMARY_GREEN,
    )
    header_table = Table([
        [
            Paragraph("SOYA-CARE", title_style),
            Paragraph(
                f"<b>REPORT ID</b>  #{esc(report_data.get('id', 'NEW'))}<br/>"
                f"<b>GENERATED</b>  {esc(str(report_data.get('created_at', ''))[:19].replace('T', ' '))}",
                meta_right,
            ),
        ],
        [
            Paragraph("SOYBEAN CROP HEALTH  •  AI DIAGNOSTICS  •  FIELD ADVISORY", subtitle_style),
            Paragraph("FARMER REPORT  |  DECISION SUPPORT", status_style),
        ],
    ], colWidths=[110 * mm, 68 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.8, color=PRIMARY_GREEN, spaceBefore=3, spaceAfter=9))
    story.append(Paragraph(
        "CROP DISEASE DIAGNOSIS REPORT",
        ParagraphStyle("ReportKicker", parent=styles["Heading2"], fontName="Helvetica-Bold",
                       fontSize=12, leading=15, textColor=TEXT_DARK, spaceAfter=7),
    ))

    # 2. Farmer and specimen metadata.
    farmer_name = farmer_info.get("name") or report_data.get("farmer_name") or "Verified Soybean Producer"
    location_str = farmer_info.get("village") or report_data.get("location_name") or "Field Site Inspection"
    if report_data.get("latitude") is not None and report_data.get("longitude") is not None:
        try:
            location_str += f" ({float(report_data['latitude']):.4f}°, {float(report_data['longitude']):.4f}°)"
        except (TypeError, ValueError):
            pass

    try:
        conf_score = float(report_data.get("confidence", 0.0)) * 100
    except (TypeError, ValueError):
        conf_score = 0.0

    meta_data = [
        [
            Paragraph("<b>FARMER / FIELD</b>", body_style), Paragraph(esc(farmer_name), body_style),
            Paragraph("<b>SPECIMEN STATUS</b>", body_style),
            Paragraph(f"<font color='{PRIMARY_GREEN.hexval()}'><b>{esc(report_data.get('verification_status', 'VERIFIED_SOYBEAN_LEAF'))}</b></font>", body_style),
        ],
        [
            Paragraph("<b>LOCATION</b>", body_style), Paragraph(esc(location_str), body_style),
            Paragraph("<b>DIAGNOSTIC MODEL</b>", body_style), Paragraph(esc(report_data.get("model_id", "SoybeanCare Vision v2.4")), body_style),
        ],
        [
            Paragraph("<b>TARGET CROP</b>", body_style), Paragraph("Soybean (<i>Glycine max</i>)", body_style),
            Paragraph("<b>AI CONFIDENCE</b>", body_style), Paragraph(f"<b>{conf_score:.1f}%</b> · Preliminary", body_bold),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[32 * mm, 56 * mm, 42 * mm, 48 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT_GREEN),
        ("BOX", (0, 0), (-1, -1), 0.8, BORDER_GREEN),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER_GREEN),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 9))

    # 3. Diagnosis and visual evidence.
    disease_name = report_data.get("disease", "Healthy Soybean Leaf")
    diag_summary = [
        Paragraph("AI DIAGNOSIS  /  PRELIMINARY FINDING", ParagraphStyle(
            "DiagHead", parent=styles["Normal"], fontSize=7.5,
            fontName="Helvetica-Bold", textColor=ACCENT_GREEN, spaceAfter=4,
        )),
        Paragraph(f"<b>{esc(disease_name)}</b>", ParagraphStyle(
            "DiagName", parent=styles["Heading1"], fontSize=16,
            leading=20, textColor=PRIMARY_GREEN, spaceAfter=4,
        )),
        Paragraph(esc(report_data.get("explanation") or report_data.get(
            "ai_explanation", "Symptoms observed on soybean foliar specimen."
        )), body_style),
    ]

    thumb_flowable = None
    b64_str = report_data.get("image_thumbnail_b64") or ""
    if b64_str and "base64," in b64_str:
        try:
            raw_img = base64.b64decode(b64_str.split("base64,", 1)[1])
            thumb_flowable = RLImage(io.BytesIO(raw_img), width=42 * mm, height=36 * mm)
            thumb_flowable.hAlign = "CENTER"
        except Exception as exc:
            logger.info("Could not render thumbnail in PDF: %s", exc)

    if thumb_flowable:
        diag_table = Table([[diag_summary, thumb_flowable]], colWidths=[130 * mm, 48 * mm])
    else:
        diag_table = Table([[diag_summary]], colWidths=[178 * mm])
    diag_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f7fbf8")),
        ("BOX", (0, 0), (-1, -1), 0.9, BORDER_GREEN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 7))

    # 4. Causes and environmental factors.
    story.append(Paragraph("Possible Causes &amp; Environmental Factors", section_heading))
    causes = report_data.get("causes") or []
    if isinstance(causes, list):
        for cause in causes:
            story.append(Paragraph(f"• {esc(cause)}", bullet_style))
    else:
        story.append(Paragraph(f"• {esc(causes)}", bullet_style))

    # 5. Recommended field actions.
    story.append(Paragraph("Recommended Action Protocol &amp; Crop Management", section_heading))
    actions = report_data.get("actions") or []
    if isinstance(actions, list):
        for action in actions:
            story.append(Paragraph(f"• {esc(action)}", bullet_style))
    else:
        story.append(Paragraph(f"• {esc(actions)}", bullet_style))

    # 6. Soil health and fertilizer advisory.
    story.append(Spacer(1, 4))
    fert_text = report_data.get("fertilizer_note") or (
        "Soybean fixes its own nitrogen through root nodulation with Bradyrhizobium bacteria. "
        "Never apply chemical nitrogen or foliar cocktails without a laboratory soil test report."
    )
    fert_table = Table([[
        Paragraph("<b>SOIL &amp; FERTILIZER ADVISORY</b><br/>" + esc(fert_text), body_style)
    ]], colWidths=[178 * mm])
    fert_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#bfdbfe")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.append(fert_table)
    story.append(Spacer(1, 7))

    # 7. Safety and agronomic disclaimer retained.
    disclaimer_text = (
        "<b>IMPORTANT: AI SCREENING DISCLAIMER</b><br/>"
        "This report is generated by automated computer vision and artificial intelligence algorithms. "
        "It constitutes a preliminary screening tool and MUST NOT be construed as a definitive, certified, "
        "or legal phytosanitary diagnosis. Disease symptoms can mimic nutrient deficiencies, herbicide injury, "
        "or insect damage. Never apply restricted chemical pesticides or hazardous chemicals based solely on "
        "an automated photo reading. Always confirm disease symptoms physically with a certified crop consultant, "
        "agricultural university specialist, or local Krishi Vigyan Kendra (KVK) officer."
    )
    alert_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[178 * mm])
    alert_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ALERT_BG),
        ("BOX", (0, 0), (-1, -1), 0.8, ALERT_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.append(alert_table)

    doc.build(story, onFirstPage=_draw_brand_page, onLaterPages=_draw_brand_page)
    output.seek(0)
    return output
