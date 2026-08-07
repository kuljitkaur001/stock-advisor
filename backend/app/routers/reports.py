from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User
from app.services.portfolio_service import PortfolioService
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["PDF Reports"])

@router.get("/portfolio-pdf")
async def generate_portfolio_pdf_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    portfolio_service = PortfolioService(db)
    summary = await portfolio_service.get_portfolio_summary(current_user)
    
    pdf_bytes = ReportService.generate_portfolio_pdf(current_user, summary)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Portfolio_Report_{current_user.full_name.replace(' ', '_')}.pdf"
        }
    )
