from pydantic import BaseModel
from datetime import datetime


class SubscriptionListItem(BaseModel):
    id: int
    customer_name: str
    plan_name: str
    cycle: str
    amount: float | None = 0.0
    next_bill_date: datetime | None = None
    status: str

    class Config:
        from_attributes = True


class OneTimeLineOut(BaseModel):
    product_name: str
    quantity: int
    amount: float


class RecurringLineOut(BaseModel):
    id: int
    plan_name: str
    cycle: str
    next_bill_date: datetime | None = None
    amount: float
    status: str

    class Config:
        from_attributes = True


class BillingDetailOut(BaseModel):
    subscription_id: int
    customer_name: str
    plan_name: str
    one_time_lines: list[OneTimeLineOut]
    recurring_lines: list[RecurringLineOut]


class ModifySubscriptionRequest(BaseModel):
    cycle: str | None = None
    amount: float | None = None


class CreateSubscriptionRequest(BaseModel):
    customer_id: int | None = 1
    plan_name: str
    cycle: str = "MONTHLY"
    amount: float = 0.0

