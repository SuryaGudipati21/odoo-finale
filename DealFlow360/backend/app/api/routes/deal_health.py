from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from collections import defaultdict
from app.database.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.quotation import Quotation, QuotationStatus

router = APIRouter()

@router.get("")
def get_deal_health(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quotes = db.query(Quotation).all()
    now = datetime.now(timezone.utc)
    
    # 1. Compute each sales rep's average discount across all quotes
    rep_quote_discounts = defaultdict(list)
    for q in quotes:
        if q.lines:
            avg_quote_disc = sum(l.discount_percent for l in q.lines) / len(q.lines)
            rep_quote_discounts[q.created_by_id].append(avg_quote_disc)
        else:
            rep_quote_discounts[q.created_by_id].append(0.0)

    rep_overall_avg = {
        rep_id: (sum(discs) / len(discs) if discs else 8.0)
        for rep_id, discs in rep_quote_discounts.items()
    }

    stalled = []
    anomalies = []
    ages = []
    open_statuses = {
        QuotationStatus.draft,
        QuotationStatus.pending_approval,
        QuotationStatus.sent_to_customer,
        QuotationStatus.negotiation,
        QuotationStatus.reapproval_required,
    }

    for q in quotes:
        created = q.created_at
        if created and created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        days = (now - created).days if created else 0
        ages.append(days)

        tot = sum(
            l.unit_price * l.quantity * (1.0 - l.discount_percent / 100.0)
            for l in q.lines
        )
        max_disc = max([l.discount_percent for l in q.lines], default=0.0)
        q_avg_disc = (sum(l.discount_percent for l in q.lines) / len(q.lines)) if q.lines else 0.0

        # Stalled Deals (open status with no activity for 3+ days)
        if q.status in open_statuses and days >= 3:
            if days >= 14 or tot >= 50000:
                priority = "high"
            elif days >= 7 or tot >= 20000:
                priority = "medium"
            else:
                priority = "low"

            action_required = (
                "Manager approval decision pending" if q.status == QuotationStatus.pending_approval
                else "Revision approval review required" if q.status == QuotationStatus.reapproval_required
                else "Client negotiation follow up" if q.status == QuotationStatus.negotiation
                else "Customer outreach required" if q.status == QuotationStatus.sent_to_customer
                else "Complete quote draft"
            )

            stalled.append({
                "quotation_id": f"Q-{str(q.id).zfill(3)}" if isinstance(q.id, int) and q.id < 1000 else f"Q-{q.id}",
                "customer": q.customer.name if q.customer else f"Customer #{q.customer_id}",
                "amount": round(tot, 2),
                "status": q.status.value if hasattr(q.status, "value") else str(q.status),
                "days_stalled": days,
                "last_activity": created.strftime("%Y-%m-%d") if created else "Recent",
                "action_required": action_required,
                "priority": priority,
            })

        # Anomalies (discount is 50%+ above the rep's own average across other quotes)
        rep_avg = round(rep_overall_avg.get(q.created_by_id, 8.0), 1)
        if rep_avg > 0 and max_disc >= (rep_avg * 1.5):
            variance = round(max_disc - rep_avg, 1)
            variance_pct = round((variance / rep_avg) * 100.0, 1)
            risk_lvl = "critical" if variance_pct >= 100.0 or max_disc >= 22.0 else "high" if variance_pct >= 70.0 else "medium"

            anomalies.append({
                "quotation_id": f"Q-{q.id}",
                "customer": q.customer.name if q.customer else f"Customer #{q.customer_id}",
                "discount_given": max_disc,
                "rep_avg": rep_avg,
                "variance": variance,
                "variance_percentage": variance_pct,
                "risk_level": risk_lvl,
                "reason": f"Concession exceeds {rep_avg}% rep benchmark by {variance_pct}%",
            })

    avg_age = round(sum(ages) / len(ages), 1) if ages else 0
    at_risk_pct = round((len(anomalies) / len(quotes)) * 100, 1) if quotes else 0

    return {
        "summary": {
            "total_stalled": len(stalled),
            "total_anomalies": len(anomalies),
            "avg_deal_age": avg_age,
            "at_risk_percentage": at_risk_pct,
        },
        "stalled_deals": stalled,
        "anomalies": anomalies,
    }

@router.get("/stalled")
def get_stalled(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = get_deal_health(db, user)
    return data["stalled_deals"]

@router.get("/anomalies")
def get_anomalies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = get_deal_health(db, user)
    return data["anomalies"]
