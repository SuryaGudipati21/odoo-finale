from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.subscription import SubscriptionPlan, SubscriptionStatus, BillingCycle
from app.schemas.subscription import (
    SubscriptionListItem,
    BillingDetailOut,
    OneTimeLineOut,
    RecurringLineOut,
    ModifySubscriptionRequest,
)

router = APIRouter()


@router.get("", response_model=list[SubscriptionListItem])
def list_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plans = db.query(SubscriptionPlan).all()
    return [
        SubscriptionListItem(
            id=p.id,
            customer_name=p.customer.name,
            plan_name=p.plan_name,
            cycle=p.cycle.value,
            next_bill_date=p.next_bill_date,
            status=p.status.value,
        )
        for p in plans
    ]


@router.get("/{plan_id}", response_model=BillingDetailOut)
def get_billing_detail(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = db.query(SubscriptionPlan).get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription not found")

    quotation = plan.quotation
    one_time = [
        OneTimeLineOut(product_name=l.product.name, quantity=l.quantity, amount=l.unit_price * l.quantity)
        for l in quotation.lines
    ]

    # every recurring plan tied to the same originating quotation
    siblings = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.quotation_id == quotation.id)
        .all()
    )
    recurring = [
        RecurringLineOut(
            id=s.id,
            plan_name=s.plan_name,
            cycle=s.cycle.value,
            next_bill_date=s.next_bill_date,
            amount=s.amount,
            status=s.status.value,
        )
        for s in siblings
    ]

    return BillingDetailOut(
        subscription_id=plan.id,
        customer_name=plan.customer.name,
        plan_name=plan.plan_name,
        one_time_lines=one_time,
        recurring_lines=recurring,
    )


@router.post("/{plan_id}/modify", response_model=SubscriptionListItem)
def modify_subscription(
    plan_id: int,
    payload: ModifySubscriptionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_manager", "admin")),
):
    plan = db.query(SubscriptionPlan).get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if plan.status == SubscriptionStatus.cancelled:
        raise HTTPException(status_code=400, detail="Cannot modify a cancelled subscription")

    if payload.cycle:
        try:
            plan.cycle = BillingCycle(payload.cycle)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid cycle")
    if payload.amount is not None:
        plan.amount = payload.amount

    db.commit()
    db.refresh(plan)
    return SubscriptionListItem(
        id=plan.id,
        customer_name=plan.customer.name,
        plan_name=plan.plan_name,
        cycle=plan.cycle.value,
        next_bill_date=plan.next_bill_date,
        status=plan.status.value,
    )


@router.post("/{plan_id}/cancel", response_model=SubscriptionListItem)
def cancel_subscription(
    plan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_manager", "admin")),
):
    plan = db.query(SubscriptionPlan).get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription not found")

    plan.status = SubscriptionStatus.cancelled
    plan.next_bill_date = None

    db.commit()
    db.refresh(plan)
    return SubscriptionListItem(
        id=plan.id,
        customer_name=plan.customer.name,
        plan_name=plan.plan_name,
        cycle=plan.cycle.value,
        next_bill_date=plan.next_bill_date,
        status=plan.status.value,
    )
