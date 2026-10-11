"""Unit tests for KPI calculations and edge case handling."""

from datetime import date
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.connection import Base
from app.models.sales import SalesRecord
from app.analytics.kpi import calculate_kpis


@pytest.fixture
def db_session():
    """Create a fresh in-memory SQLite database session for testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_empty_dataset_returns_zeros(db_session):
    """Test KPI calculation on an empty database returns all zeros."""
    kpis = calculate_kpis(db_session)
    assert kpis.total_revenue == 0.0
    assert kpis.total_profit == 0.0
    assert kpis.total_orders == 0
    assert kpis.total_units_sold == 0
    assert kpis.avg_order_value == 0.0
    assert kpis.profit_margin == 0.0
    assert kpis.prev_revenue == 0.0
    assert kpis.prev_profit == 0.0
    assert kpis.revenue_change_pct == 0.0
    assert kpis.profit_change_pct == 0.0
    assert kpis.record_count == 0


def test_kpi_calculation_with_sample_data(db_session):
    """Test KPI metrics with normal sales line items."""
    records = [
        SalesRecord(
            order_id="ORD-001",
            order_date=date(2023, 5, 10),
            sales=100.0,
            profit=20.0,
            quantity=2,
            category="Technology",
            region="West",
            upload_batch_id="batch-1"
        ),
        SalesRecord(
            order_id="ORD-001",  # Same order, another item
            order_date=date(2023, 5, 10),
            sales=50.0,
            profit=10.0,
            quantity=1,
            category="Furniture",
            region="West",
            upload_batch_id="batch-1"
        ),
        SalesRecord(
            order_id="ORD-002",
            order_date=date(2023, 5, 12),
            sales=200.0,
            profit=40.0,
            quantity=5,
            category="Technology",
            region="West",
            upload_batch_id="batch-1"
        )
    ]
    db_session.add_all(records)
    db_session.commit()

    kpis = calculate_kpis(db_session, start_date=date(2023, 5, 10), end_date=date(2023, 5, 15))
    assert kpis.total_revenue == 350.0
    assert kpis.total_profit == 70.0
    assert kpis.total_orders == 2  # ORD-001 and ORD-002 distinct
    assert kpis.total_units_sold == 8
    assert kpis.avg_order_value == round(350.0 / 2, 2)
    assert kpis.profit_margin == round((70.0 / 350.0) * 100.0, 2)
    assert kpis.record_count == 3


def test_zero_revenue_and_profit_margin_handling(db_session):
    """Test that zero revenue does not cause ZeroDivisionError and profit margin is 0.0."""
    rec = SalesRecord(
        order_id="ORD-FREE",
        order_date=date(2023, 6, 1),
        sales=0.0,
        profit=-15.0,
        quantity=3,
        category="Office Supplies",
        region="East",
        upload_batch_id="batch-free"
    )
    db_session.add(rec)
    db_session.commit()

    kpis = calculate_kpis(db_session)
    assert kpis.total_revenue == 0.0
    assert kpis.total_profit == -15.0
    assert kpis.total_orders == 1
    assert kpis.profit_margin == 0.0
    assert kpis.avg_order_value == 0.0


def test_previous_period_calculation(db_session):
    """Test that previous period comparison accurately tracks change percentages."""
    # Previous period: May 1 to May 5 (5 days)
    # Current period: May 6 to May 10 (5 days)
    records = [
        # Previous period records
        SalesRecord(
            order_id="PREV-1",
            order_date=date(2023, 5, 2),
            sales=100.0,
            profit=20.0,
            quantity=2,
            region="East",
            upload_batch_id="batch-prev"
        ),
        # Current period records
        SalesRecord(
            order_id="CURR-1",
            order_date=date(2023, 5, 7),
            sales=150.0,
            profit=30.0,
            quantity=3,
            region="East",
            upload_batch_id="batch-curr"
        )
    ]
    db_session.add_all(records)
    db_session.commit()

    kpis = calculate_kpis(
        db_session,
        start_date=date(2023, 5, 6),
        end_date=date(2023, 5, 10)
    )

    assert kpis.total_revenue == 150.0
    assert kpis.total_profit == 30.0
    assert kpis.prev_revenue == 100.0
    assert kpis.prev_profit == 20.0
    assert kpis.revenue_change_pct == 50.0  # (150 - 100) / 100 * 100
    assert kpis.profit_change_pct == 50.0   # (30 - 20) / 20 * 100
