import io
import base64
import logging
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage

logger = logging.getLogger(__name__)

def esc(text: any) -> str:
    """Escape XML special characters for ReportLab Paragraphs."""
    return str(text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def generate_pdf_report(report_data: dict, farmer_info: dict = None) -> io.BytesIO:
    """
    PHASE 8: Professional Agricultural PDF Report Generator
    Creates a branded, green-and-white A4 PDF report with leaf thumbnail,
    ICAR agronomic guidance, and strict safety disclaimers.
    """
    farmer_info = farmer_info or {}
    output = io.BytesIO()

    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY_GREEN = colors.HexColor("#065f46")   # Deep emerald/forest green
    ACCENT_GREEN = colors.HexColor("#059669")    # Vibrant emerald
    BG_LIGHT_GREEN = colors.HexColor("#f0fdf4")  # Soft mint background
    BORDER_GREEN = colors.HexColor("#bbf7d0")    # Border tint
    TEXT_MUTED = colors.HexColor("#4b5563")      # Slate gray
    TEXT_DARK = colors.HexColor("#111827")       # Rich charcoal
    ALERT_BG = colors.HexColor("#fffbeb")        # Warm amber alert background
    ALERT_BORDER = colors.HexColor("#fde68a")    # Amber border

    # Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=PRIMARY_GREEN,
        alignment=TA_LEFT,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=ACCENT_GREEN,
        alignment=TA_LEFT,
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=PRIMARY_GREEN,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK
    )

    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK,
        leftIndent=12,
        spaceAfter=3
    )

    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["BodyText"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=11,
        textColor=colors.HexColor("#92400e")
    )

    story = []

    # 1. Header Banner
    header_table_data = [
        [
            Paragraph("SoybeanCare AI", title_style),
            Paragraph(f"<b>Report ID:</b> #{report_data.get('id', 'NEW')}<br/><b>Date:</b> {esc(str(report_data.get('created_at', ''))[:19].replace('T', ' '))}", ParagraphStyle("MetaRight", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=8.5, leading=12, textColor=TEXT_MUTED))
        ],
        [
            Paragraph("AI-POWERED SOYBEAN HEALTH ANALYSIS &amp; AGRONOMIC ADVISORY", subtitle_style),
            Paragraph("CONFIDENTIAL · DECISION SUPPORT ONLY", ParagraphStyle("StatusTag", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=7.5, fontName="Helvetica-Bold", textColor=PRIMARY_GREEN))
        ]
    ]
    header_table = Table(header_table_data, colWidths=[110 * mm, 68 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_GREEN, spaceBefore=4, spaceAfter=8))

    # 2. Farmer & Specimen Summary Metadata
    farmer_name = farmer_info.get("name") or report_data.get("farmer_name") or "Verified Soybean Producer"
    location_str = farmer_info.get("village") or report_data.get("location_name") or "Field Site Inspection"
    if report_data.get("latitude") and report_data.get("longitude"):
        location_str += f" ({report_data['latitude']:.4f}°N, {report_data['longitude']:.4f}°E)"

    conf_score = float(report_data.get("confidence", 0.0)) * 100
    meta_data = [
        [
            Paragraph("<b>Farmer / Field:</b>", body_style), Paragraph(esc(farmer_name), body_style),
            Paragraph("<b>Specimen Verification:</b>", body_style), Paragraph(f"<font color='{PRIMARY_GREEN.hexval()}'><b>{esc(report_data.get('verification_status', 'VERIFIED_SOYBEAN_LEAF'))}</b></font>", body_style)
        ],
        [
            Paragraph("<b>Location:</b>", body_style), Paragraph(esc(location_str), body_style),
            Paragraph("<b>Diagnostic Model:</b>", body_style), Paragraph(esc(report_data.get("model_id", "SoybeanCare Vision v2.4")), body_style)
        ],
        [
            Paragraph("<b>Target Crop:</b>", body_style), Paragraph("Soybean (<i>Glycine max</i>)", body_style),
            Paragraph("<b>Model Confidence:</b>", body_style), Paragraph(f"<b>{conf_score:.1f}%</b> (Preliminary)", body_bold)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[32 * mm, 56 * mm, 42 * mm, 48 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT_GREEN),
        ("BOX", (0, 0), (-1, -1), 0.8, BORDER_GREEN),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER_GREEN),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Diagnosis & Image Visual Evidence Box
    disease_name = report_data.get("disease", "Healthy Soybean Leaf")
    diag_summary = [
        Paragraph("PRELIMINARY DIAGNOSIS", ParagraphStyle("DiagHead", parent=styles["Normal"], fontSize=8, fontName="Helvetica-Bold", textColor=PRIMARY_GREEN)),
        Paragraph(f"<b>{esc(disease_name)}</b>", ParagraphStyle("DiagName", parent=styles["Heading1"], fontSize=16, leading=20, textColor=PRIMARY_GREEN)),
        Paragraph(esc(report_data.get("explanation") or report_data.get("ai_explanation", "Symptoms observed on soybean foliar specimen.")), body_style)
    ]

    # Check if thumbnail image base64 is available
    thumb_flowable = None
    b64_str = report_data.get("image_thumbnail_b64") or ""
    if b64_str and "base64," in b64_str:
        try:
            raw_img = base64.b64decode(b64_str.split("base64,")[1])
            thumb_stream = io.BytesIO(raw_img)
            thumb_flowable = RLImage(thumb_stream, width=42 * mm, height=36 * mm)
        except Exception as e:
            logger.info(f"Could not render thumbnail in PDF: {e}")

    if thumb_flowable:
        diag_table_data = [[diag_summary, thumb_flowable]]
        diag_table = Table(diag_table_data, colWidths=[130 * mm, 48 * mm])
    else:
        diag_table_data = [[diag_summary]]
        diag_table = Table(diag_table_data, colWidths=[178 * mm])

    diag_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 6))

    # 4. Possible Causes & Symptoms
    story.append(Paragraph("Possible Causes &amp; Environmental Factors", section_heading))
    causes = report_data.get("causes") or []
    if isinstance(causes, list):
        for c in causes:
            story.append(Paragraph(f"• {esc(c)}", bullet_style))
    else:
        story.append(Paragraph(f"• {esc(causes)}", bullet_style))

    # 5. Suggested Agronomic Next Steps
    story.append(Paragraph("Recommended Action Protocol &amp; Crop Management", section_heading))
    actions = report_data.get("actions") or []
    if isinstance(actions, list):
        for a in actions:
            story.append(Paragraph(f"• {esc(a)}", bullet_style))
    else:
        story.append(Paragraph(f"• {esc(actions)}", bullet_style))

    # 6. Soil Health & Fertilizer Safety Box
    story.append(Spacer(1, 4))
    fert_text = report_data.get("fertilizer_note") or (
        "Soybean fixes its own nitrogen through root nodulation with Bradyrhizobium bacteria. "
        "Never apply chemical nitrogen or foliar cocktails without a laboratory soil test report."
    )
    fert_table = Table(
        [[
            Paragraph("<b>IMPORTANT SOIL &amp; FERTILIZER ADVISORY:</b> " + esc(fert_text), body_style)
        ]],
        colWidths=[178 * mm]
    )
    fert_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#bfdbfe")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(fert_table)
    story.append(Spacer(1, 6))

    # 7. Official Agricultural Disclaimer
    disclaimer_text = (
        "<b>LEGAL &amp; AGRONOMIC DISCLAIMER:</b> This report is generated by automated computer vision and artificial "
        "intelligence algorithms. It constitutes a preliminary screening tool and MUST NOT be construed as a definitive, "
        "certified, or legal phytosanitary diagnosis. Disease symptoms can mimic nutrient deficiencies, herbicide injury, or insect damage. "
        "Never apply restricted chemical pesticides or hazardous chemicals based solely on an automated photo reading. "
        "Always confirm disease symptoms physically with a certified crop consultant, agricultural university specialist, "
        "or local Krishi Vigyan Kendra (KVK) officer."
    )
    alert_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[178 * mm])
    alert_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ALERT_BG),
        ("BOX", (0, 0), (-1, -1), 0.8, ALERT_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(alert_table)

    doc.build(story)
    output.seek(0)
    return output
