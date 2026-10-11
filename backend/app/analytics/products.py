"""Product analytics and profitability analysis."""

from datetime import date
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import ProductMetric, ProfitabilityItem


def get_top_products(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 10
) -> List[ProductMetric]:
    """Retrieve top-performing products ranked by total revenue.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        region: Geographic region filter.
        category: Product category filter.
        limit: Maximum number of records to return.

    Returns:
        List[ProductMetric]: Top products sorted by revenue descending.
    """
    stmt = select(
        func.coalesce(SalesRecord.product_name, "Unknown Product").label("prod_name"),
        func.coalesce(SalesRecord.category, "Uncategorized").label("cat_name"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit"),
        func.coalesce(func.sum(SalesRecord.quantity), 0).label("quantity")
    ).group_by(
        SalesRecord.product_name,
        SalesRecord.category
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    ).limit(limit)

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)
    if category:
        stmt = stmt.where(SalesRecord.category == category)

    rows = db.execute(stmt).all()

    products: List[ProductMetric] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        prof = round(float(r.profit), 2)
        qty = int(r.quantity)
        margin = round((prof / rev) * 100.0, 2) if rev > 0 else 0.0

        products.append(
            ProductMetric(
                product_name=str(r.prod_name),
                category=str(r.cat_name),
                revenue=rev,
                profit=prof,
                quantity=qty,
                profit_margin=margin
            )
        )

    return products


def get_profitability_analysis(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    region: Optional[str] = None
) -> List[ProfitabilityItem]:
    """Analyze profitability across products to highlight high and loss-making items.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        region: Region filter.

    Returns:
        List[ProfitabilityItem]: Ranked items showing negative profit status.
    """
    stmt = select(
        func.coalesce(SalesRecord.product_name, "Unknown Product").label("prod_name"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit")
    ).group_by(
        SalesRecord.product_name
    ).order_by(
        func.sum(SalesRecord.profit).asc()
    ).limit(50)

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)

    rows = db.execute(stmt).all()

    items: List[ProfitabilityItem] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        prof = round(float(r.profit), 2)
        margin = round((prof / rev) * 100.0, 2) if rev > 0 else 0.0

        items.append(
            ProfitabilityItem(
                name=str(r.prod_name),
                revenue=rev,
                profit=prof,
                profit_margin=margin,
                is_negative=(prof < 0)
            )
        )

    return items
