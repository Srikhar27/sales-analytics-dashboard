"""Category and Sub-category analytics metrics."""

from datetime import date
from typing import List, Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import CategoryMetric


def get_category_metrics(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    region: Optional[str] = None
) -> List[CategoryMetric]:
    """Calculate performance metrics aggregated by primary product category.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        region: Region filter.

    Returns:
        List[CategoryMetric]: Category metrics sorted by revenue descending.
    """
    stmt = select(
        func.coalesce(SalesRecord.category, "Uncategorized").label("category_name"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit"),
        func.coalesce(func.sum(SalesRecord.quantity), 0).label("quantity"),
        func.count(distinct(SalesRecord.order_id)).label("orders")
    ).group_by(
        SalesRecord.category
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    )

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)

    rows = db.execute(stmt).all()

    metrics: List[CategoryMetric] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        prof = round(float(r.profit), 2)
        qty = int(r.quantity)
        ords = int(r.orders)
        margin = round((prof / rev) * 100.0, 2) if rev > 0 else 0.0

        metrics.append(
            CategoryMetric(
                category=str(r.category_name),
                revenue=rev,
                profit=prof,
                quantity=qty,
                orders=ords,
                profit_margin=margin
            )
        )

    return metrics


def get_subcategory_metrics(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    region: Optional[str] = None,
    category: Optional[str] = None
) -> List[CategoryMetric]:
    """Calculate performance metrics aggregated by product sub-category.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        region: Region filter.
        category: Filter by parent category.

    Returns:
        List[CategoryMetric]: Sub-category metrics sorted by revenue descending.
    """
    stmt = select(
        func.coalesce(SalesRecord.sub_category, "Uncategorized").label("sub_cat_name"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit"),
        func.coalesce(func.sum(SalesRecord.quantity), 0).label("quantity"),
        func.count(distinct(SalesRecord.order_id)).label("orders")
    ).group_by(
        SalesRecord.sub_category
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    )

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)
    if category:
        stmt = stmt.where(SalesRecord.category == category)

    rows = db.execute(stmt).all()

    metrics: List[CategoryMetric] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        prof = round(float(r.profit), 2)
        qty = int(r.quantity)
        ords = int(r.orders)
        margin = round((prof / rev) * 100.0, 2) if rev > 0 else 0.0

        metrics.append(
            CategoryMetric(
                category=str(r.sub_cat_name),
                revenue=rev,
                profit=prof,
                quantity=qty,
                orders=ords,
                profit_margin=margin
            )
        )

    return metrics
