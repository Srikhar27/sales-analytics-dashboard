"""Regional analytics metrics."""

from datetime import date
from typing import List, Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import RegionMetric


def get_region_metrics(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None
) -> List[RegionMetric]:
    """Calculate sales and profit performance metrics grouped by region.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        category: Category filter.

    Returns:
        List[RegionMetric]: Regional metric aggregates sorted by revenue descending.
    """
    stmt = select(
        func.coalesce(SalesRecord.region, "Unknown").label("region_name"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit"),
        func.coalesce(func.sum(SalesRecord.quantity), 0).label("quantity"),
        func.count(distinct(SalesRecord.order_id)).label("orders")
    ).group_by(
        SalesRecord.region
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    )

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if category:
        stmt = stmt.where(SalesRecord.category == category)

    rows = db.execute(stmt).all()

    metrics: List[RegionMetric] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        prof = round(float(r.profit), 2)
        qty = int(r.quantity)
        ords = int(r.orders)
        margin = round((prof / rev) * 100.0, 2) if rev > 0 else 0.0

        metrics.append(
            RegionMetric(
                region=str(r.region_name),
                revenue=rev,
                profit=prof,
                quantity=qty,
                orders=ords,
                profit_margin=margin
            )
        )

    return metrics
