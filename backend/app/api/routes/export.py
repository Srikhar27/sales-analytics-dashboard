"""Data and metrics CSV export API endpoints."""

import io
from datetime import date
from typing import Optional, Literal
import pandas as pd
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.sales import DateRangeFilter
from app.schemas.analytics import DataQualityReport
from app.services.data_service import export_to_csv
from app.services.upload_service import get_data_quality_report
from app.analytics.kpi import calculate_kpis
from app.analytics.categories import get_category_metrics
from app.analytics.regions import get_region_metrics

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/csv")
def export_csv_data(
    type: Literal["records", "summary"] = Query("records", description="Export type: 'records' or 'summary'"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    region: Optional[str] = Query(None, description="Region filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: Session = Depends(get_db)
) -> Response:
    """Export sales records or summarized KPI metrics as a CSV file download."""
    filters = DateRangeFilter(
        start_date=start_date,
        end_date=end_date,
        region=region,
        category=category
    )

    if type == "summary":
        kpi = calculate_kpis(db, start_date=start_date, end_date=end_date, region=region, category=category)
        cat_metrics = get_category_metrics(db, start_date=start_date, end_date=end_date, region=region)
        reg_metrics = get_region_metrics(db, start_date=start_date, end_date=end_date, category=category)

        summary_rows = [
            {"Metric": "Total Revenue", "Value": f"${kpi.total_revenue:,.2f}"},
            {"Metric": "Total Profit", "Value": f"${kpi.total_profit:,.2f}"},
            {"Metric": "Profit Margin", "Value": f"{kpi.profit_margin:.2f}%"},
            {"Metric": "Total Orders", "Value": str(kpi.total_orders)},
            {"Metric": "Units Sold", "Value": str(kpi.total_units_sold)},
            {"Metric": "Average Order Value", "Value": f"${kpi.avg_order_value:,.2f}"},
            {"Metric": "Revenue Change (%)", "Value": f"{kpi.revenue_change_pct:+.2f}%"},
            {"Metric": "Profit Change (%)", "Value": f"{kpi.profit_change_pct:+.2f}%"},
            {"Metric": "Total Records", "Value": str(kpi.record_count)},
        ]
        summary_df = pd.DataFrame(summary_rows)

        cat_df = pd.DataFrame([
            {
                "Category": c.category,
                "Revenue": c.revenue,
                "Profit": c.profit,
                "Quantity": c.quantity,
                "Orders": c.orders,
                "Margin (%)": c.profit_margin
            }
            for c in cat_metrics
        ])

        reg_df = pd.DataFrame([
            {
                "Region": r.region,
                "Revenue": r.revenue,
                "Profit": r.profit,
                "Quantity": r.quantity,
                "Orders": r.orders,
                "Margin (%)": r.profit_margin
            }
            for r in reg_metrics
        ])

        buf = io.StringIO()
        buf.write("# KPI SUMMARY\n")
        summary_df.to_csv(buf, index=False)
        buf.write("\n# CATEGORY METRICS\n")
        cat_df.to_csv(buf, index=False)
        buf.write("\n# REGIONAL METRICS\n")
        reg_df.to_csv(buf, index=False)

        csv_content = buf.getvalue()
        filename = "sales_summary.csv"
    else:
        csv_content = export_to_csv(db=db, filters=filters)
        filename = "sales_records.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/quality-report", response_model=DataQualityReport)
def export_quality_report(
    db: Session = Depends(get_db)
) -> DataQualityReport:
    """Export current dataset health and quality assessment report."""
    return get_data_quality_report(db=db)
