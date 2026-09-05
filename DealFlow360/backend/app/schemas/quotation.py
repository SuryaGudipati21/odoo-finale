from pydantic import BaseModel


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


class QuotationLineOut(QuotationLineIn):
    id: int

    class Config:
        from_attributes = True


class QuotationOut(BaseModel):
    id: int
    customer_id: int
    status: str
    risk_score: float
    lines: list[QuotationLineOut]

    class Config:
        from_attributes = True