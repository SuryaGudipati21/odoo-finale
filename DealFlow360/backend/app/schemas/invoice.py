from pydantic import BaseModel
from datetime import datetime


class InvoiceListItem(BaseModel):
    id: int
    invoice_number: str
    customer_name: str
    amount: float
    status: str
    due_date: datetime

    class Config:
        from_attributes = True


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    quotation_id: int
    customer_name: str
    amount: float
    status: str
    pipeline_stage: str
    is_recurring: bool
    due_date: datetime
    paid_at: datetime | None = None

    class Config:
        from_attributes = True


class RecordPaymentRequest(BaseModel):
    amount: float | None = None
