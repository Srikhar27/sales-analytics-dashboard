"""Dashboard high-level summary and trends API endpoints."""

from datetime import date
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.analytics import KPISummary, RevenueTrendPoint, BusinessInsight
from app.analytics.kpi import calculate_kpis
from app.analytics.trends import get_revenue_trends
from app.analytics.insights import generate_insights

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=KPISummary)
def get_dashboard_summary(
    start_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Geographic region"),
    category: Optional[str] = Query(None, description="Product category"),
    db: Session = Depends(get_db)
) -> KPISummary:
    """Retrieve overarching executive KPIs including revenue, profit, orders, and comparative changes."""
    return calculate_kpis(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region,
        category=category
    )


@router.get("/revenue-trends", response_model=List[RevenueTrendPoint])
def get_dashboard_revenue_trends(
    granularity: Literal["daily", "weekly", "monthly"] = Query("monthly", description="Time interval aggregation"),
    start_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Geographic region"),
    category: Optional[str] = Query(None, description="Product category"),
    db: Session = Depends(get_db)
) -> List[RevenueTrendPoint]:
    """Retrieve time-series revenue and profit trends aggregated by daily, weekly, or monthly periods."""
    return get_revenue_trends(
        db=db,
        start_date=start_date,
        end_date=end_date,
        granularity=granularity,
        region=region,
        category=category
    )


@router.get("/insights", response_model=List[BusinessInsight])
def get_dashboard_insights(
    start_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
) -> List[BusinessInsight]:
    """Generate rule-based business observations and operational alerts from sales data."""
    return generate_insights(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
