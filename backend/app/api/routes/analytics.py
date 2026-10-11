"""Analytics API endpoints for categories, regions, products, and customer segments."""

from datetime import date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.analytics import (
    CategoryMetric,
    RegionMetric,
    ProductMetric,
    CustomerMetric,
    ProfitabilityItem,
)
from app.analytics.categories import get_category_metrics, get_subcategory_metrics
from app.analytics.regions import get_region_metrics
from app.analytics.products import get_top_products, get_profitability_analysis
from app.analytics.customers import get_top_customers, get_customer_segments

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/categories", response_model=List[CategoryMetric])
def get_categories_breakdown(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Region filter"),
    db: Session = Depends(get_db)
) -> List[CategoryMetric]:
    """Retrieve revenue and profit metrics aggregated by product category."""
    return get_category_metrics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region
    )


@router.get("/subcategories", response_model=List[CategoryMetric])
def get_subcategories_breakdown(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Region filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: Session = Depends(get_db)
) -> List[CategoryMetric]:
    """Retrieve revenue and profit metrics aggregated by sub-category."""
    return get_subcategory_metrics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region,
        category=category
    )


@router.get("/regions", response_model=List[RegionMetric])
def get_regions_breakdown(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: Session = Depends(get_db)
) -> List[RegionMetric]:
    """Retrieve performance metrics across geographical regions."""
    return get_region_metrics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        category=category
    )


@router.get("/top-products", response_model=List[ProductMetric])
def get_top_performing_products(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Region filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    limit: int = Query(10, ge=1, le=100, description="Number of products to return"),
    db: Session = Depends(get_db)
) -> List[ProductMetric]:
    """Retrieve highest revenue-generating products."""
    return get_top_products(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region,
        category=category,
        limit=limit
    )


@router.get("/top-customers", response_model=List[CustomerMetric])
def get_top_performing_customers(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Region filter"),
    limit: int = Query(10, ge=1, le=100, description="Number of customers to return"),
    db: Session = Depends(get_db)
) -> List[CustomerMetric]:
    """Retrieve highest spending customers and order metrics."""
    return get_top_customers(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region,
        limit=limit
    )


@router.get("/profitability", response_model=List[ProfitabilityItem])
def get_profitability_metrics(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[str] = Query(None, description="Region filter"),
    db: Session = Depends(get_db)
) -> List[ProfitabilityItem]:
    """Retrieve profitability rankings to identify profit drivers and loss-making items."""
    return get_profitability_analysis(
        db=db,
        start_date=start_date,
        end_date=end_date,
        region=region
    )


@router.get("/customer-segments", response_model=List[Dict[str, Any]])
def get_customer_segmentation_breakdown(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieve revenue and customer count aggregates across market segments."""
    return get_customer_segments(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
