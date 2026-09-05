from pydantic import BaseModel


class SubscriptionPlanCreate(BaseModel):
    name: str
    cycle: str
    price: float


class BillingScheduleCreate(BaseModel):
    quotation_line_id: int
    subscription_plan_id: int