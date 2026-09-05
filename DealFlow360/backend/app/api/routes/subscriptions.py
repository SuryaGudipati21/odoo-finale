from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import require_role, get_current_user
from app.models.user import User
from app.models.subscription import SubscriptionPlan, BillingSchedule, SubscriptionStatus
from app.models.quotation import QuotationLine
from app.schemas.subscription import SubscriptionPlanCreate, BillingScheduleCreate
from app.services.billing import next_billing_date

router = APIRouter()


@router.post("/plans")
def create_plan(payload: SubscriptionPlanCreate, db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    plan = SubscriptionPlan(**payload.dict())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans")
def list_plans(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(SubscriptionPlan).all()


@router.post("/billing-schedule")
def create_billing_schedule(payload: BillingScheduleCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    line = db.query(QuotationLine).get(payload.quotation_line_id)
    plan = db.query(SubscriptionPlan).get(payload.subscription_plan_id)
    if not line or not plan:
        raise HTTPException(status_code=404, detail="Line or plan not found")

    line.subscription_plan_id = plan.id
    schedule = BillingSchedule(
        quotation_line_id=line.id,
        next_billing_date=next_billing_date(plan.cycle.value),
        amount=plan.price,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.post("/billing-schedule/{schedule_id}/cancel")
def cancel_schedule(schedule_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    schedule = db.query(BillingSchedule).get(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule.status = SubscriptionStatus.cancelled
    db.commit()
    return {"status": "cancelled"}