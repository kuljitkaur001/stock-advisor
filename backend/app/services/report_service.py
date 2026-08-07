import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.schemas.schemas import PortfolioSummaryResponse
from app.models.models import User

class ReportService:
    @staticmethod
    def generate_portfolio_pdf(user: User, summary: PortfolioSummaryResponse) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'),
            alignment=0,
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=15
        )
        heading2_style = ParagraphStyle(
            'ReportH2',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=12,
            spaceAfter=8
        )
        normal_style = styles['Normal']

        elements = []

        # Title Block
        elements.append(Paragraph("<b>AI Stock Advisor & Virtual Portfolio Report</b>", title_style))
        elements.append(Paragraph(f"Generated for: <b>{user.full_name}</b> ({user.email}) | Date: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=15))

        # Executive Summary Table
        elements.append(Paragraph("Account Overview", heading2_style))
        overview_data = [
            ["Metric", "Value"],
            ["USD Virtual Cash", f"${summary.virtual_balance_usd:,.2f}"],
            ["INR Virtual Cash", f"₹{summary.virtual_balance_inr:,.2f}"],
            ["Total Invested (USD Equiv)", f"${summary.total_invested_usd:,.2f}"],
            ["Current Value (USD Equiv)", f"${summary.total_current_value_usd:,.2f}"],
            ["Total Unrealized PnL", f"${summary.total_pnl_usd:,.2f} ({summary.total_pnl_percent_usd:+.2f}%)"]
        ]
        t_overview = Table(overview_data, colWidths=[240, 280])
        t_overview.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
        ]))
        elements.append(t_overview)
        elements.append(Spacer(1, 15))

        # Holdings Table
        elements.append(Paragraph("Current Holdings", heading2_style))
        if summary.holdings:
            holdings_data = [["Ticker", "Company", "Market", "Qty", "Avg Buy", "Cur Price", "Invested", "Cur Value", "PnL %"]]
            for h in summary.holdings:
                curr_symbol = "₹" if h.market.value == "IN" else "$"
                holdings_data.append([
                    h.ticker,
                    h.company_name[:20],
                    h.market.value,
                    f"{h.quantity:.2f}",
                    f"{curr_symbol}{h.average_buy_price:.2f}",
                    f"{curr_symbol}{h.current_price:.2f}",
                    f"{curr_symbol}{h.total_invested:.2f}",
                    f"{curr_symbol}{h.current_value:.2f}",
                    f"{h.unrealized_pnl_percent:+.2f}%"
                ])
            t_holdings = Table(holdings_data, colWidths=[55, 100, 45, 40, 60, 60, 65, 65, 50])
            t_holdings.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F1F5F9')])
            ]))
            elements.append(t_holdings)
        else:
            elements.append(Paragraph("No active portfolio holdings.", normal_style))

        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<i>Disclaimer: This document is generated for virtual portfolio tracking and educational purposes only. Not financial advice.</i>", ParagraphStyle('Disclaimer', parent=styles['Italic'], fontSize=8, textColor=colors.gray)))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
