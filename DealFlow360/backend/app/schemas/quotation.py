from pydantic import BaseModel
from datetime import datetime


class QuotationLineIn(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    discount_percent: float = 0


class QuotationLinesUpdate(BaseModel):
    lines: list[QuotationLineIn]


class QuotationCreate(BaseModel):
    customer_id: int
    lines: list[QuotationLineIn]


class QuotationLineOut(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    category: str | None = None
    quantity: int
    unit_price: float
    discount_percent: float = 0
    line_total: float | None = None

    class Config:
        from_attributes = True


class QuotationOut(BaseModel):
    id: int
    customer_id: int
    customer_name: str | None = None
    status: str
    risk_score: float
    total_amount: float | None = None
    created_at: datetime | None = None
    lines: list[QuotationLineOut] = []

    class Config:
        from_attributes = True


class QuotationListItem(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    status: str
    risk_score: float
    total_amount: float
    line_count: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True