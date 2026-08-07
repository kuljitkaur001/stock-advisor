from fastapi import APIRouter
from app.schemas.schemas import RecommendationResponse
from app.ai.agent import StockAnalysisAgent
from datetime import datetime

router = APIRouter(prefix="/analysis", tags=["AI Recommendation Engine"])



@router.get("/recommendation/{ticker}", response_model=RecommendationResponse)
async def get_ai_recommendation(ticker: str):
    analysis_dict = await StockAnalysisAgent.run_analysis(ticker)
    analysis_dict.setdefault("created_at", datetime.utcnow().isoformat())

    analysis_dict["reasons"] = analysis_dict["reasons"].split("\n")
    analysis_dict["supporting_indicators"] = analysis_dict["supporting_indicators"].split("\n")
    analysis_dict["potential_risks"] = [r.strip() for r in analysis_dict["potential_risks"].split(",")]
    analysis_dict["alternative_stocks"] = [a.strip() for a in analysis_dict["alternative_stocks"].split(",")]
    return RecommendationResponse(**analysis_dict)
