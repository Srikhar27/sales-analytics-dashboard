"""Sales record database model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, func
from app.database.connection import Base


class SalesRecord(Base):
    """SQLAlchemy model representing an individual sales order item record."""

    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    order_id = Column(String(100), nullable=False, index=True)
    order_date = Column(Date, nullable=False, index=True)
    ship_date = Column(Date, nullable=True)
    ship_mode = Column(String(50), nullable=True)
    customer_id = Column(String(50), nullable=True, index=True)
    customer_name = Column(String(255), nullable=True)
    segment = Column(String(50), nullable=True, index=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(50), nullable=True)
    region = Column(String(50), nullable=True, index=True)
    product_id = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    sub_category = Column(String(100), nullable=True, index=True)
    product_name = Column(String(255), nullable=True)
    sales = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=True)
    discount = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)
    upload_batch_id = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
