"""Unit tests for CSV data ingestion and validation."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.connection import Base
from app.services.upload_service import (
    process_csv_upload,
    detect_column_mapping,
    get_data_quality_report,
)


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


def test_column_mapping_auto_detection():
    """Test auto-detection of common Superstore column headers."""
    headers = [
        "Order ID", "Order Date", "Ship Date", "Customer Name",
        "Segment", "City", "State", "Region", "Category",
        "Sub-Category", "Product Name", "Sales", "Quantity", "Profit"
    ]
    mapping = detect_column_mapping(headers)
    assert mapping["Order ID"] == "order_id"
    assert mapping["Order Date"] == "order_date"
    assert mapping["Customer Name"] == "customer_name"
    assert mapping["Sales"] == "sales"
    assert mapping["Profit"] == "profit"
    assert mapping["Sub-Category"] == "sub_category"


def test_valid_csv_upload(db_session):
    """Test standard valid CSV upload inserts records correctly."""
    csv_content = (
        "Order ID,Order Date,Sales,Quantity,Profit,Category,Region\n"
        "CA-2023-1001,2023-01-15,250.50,2,45.20,Furniture,West\n"
        "CA-2023-1002,2023-01-16,120.00,1,-10.00,Technology,East\n"
    ).encode("utf-8")

    res = process_csv_upload(
        file_bytes=csv_content,
        filename="sales.csv",
        column_mapping=None,
        db=db_session
    )

    assert res.records_processed == 2
    assert res.records_inserted == 2
    assert len(res.errors) == 0
    assert res.quality_report.negative_profits == 1


def test_missing_required_columns(db_session):
    """Test upload fails gracefully when required columns are missing."""
    csv_content = (
        "Customer Name,Quantity,Profit\n"
        "John Doe,2,45.20\n"
    ).encode("utf-8")

    res = process_csv_upload(
        file_bytes=csv_content,
        filename="missing_cols.csv",
        column_mapping=None,
        db=db_session
    )

    assert res.records_inserted == 0
    assert len(res.errors) > 0
    assert "Missing required columns" in res.errors[0]


def test_invalid_date_formats(db_session):
    """Test handling of invalid date formats in CSV."""
    csv_content = (
        "Order ID,Order Date,Sales\n"
        "ORD-VALID,2023-01-15,100.00\n"
        "ORD-INVALID,invalid-date-xyz,200.00\n"
    ).encode("utf-8")

    res = process_csv_upload(
        file_bytes=csv_content,
        filename="invalid_dates.csv",
        column_mapping=None,
        db=db_session
    )

    # Valid row inserted, invalid date row skipped
    assert res.records_processed == 2
    assert res.records_inserted == 1
    assert res.quality_report.invalid_dates == 1
    assert len(res.warnings) > 0


def test_empty_csv(db_session):
    """Test handling of empty CSV file."""
    res = process_csv_upload(
        file_bytes=b"",
        filename="empty.csv",
        column_mapping=None,
        db=db_session
    )

    assert res.records_processed == 0
    assert res.records_inserted == 0
    assert len(res.warnings) > 0 or len(res.errors) > 0


def test_duplicate_detection(db_session):
    """Test that duplicates in raw data and DB are tracked in quality report."""
    csv_content = (
        "Order ID,Order Date,Sales,Product ID\n"
        "ORD-DUP,2023-02-01,100.00,PROD-1\n"
        "ORD-DUP,2023-02-01,100.00,PROD-1\n"
    ).encode("utf-8")

    res = process_csv_upload(
        file_bytes=csv_content,
        filename="duplicates.csv",
        column_mapping=None,
        db=db_session
    )

    assert res.records_processed == 2
    assert res.records_inserted == 2
    assert res.quality_report.duplicate_rows == 1

    # Check overall database quality report
    report = get_data_quality_report(db_session)
    assert report.total_records == 2
    assert report.duplicate_rows == 1
