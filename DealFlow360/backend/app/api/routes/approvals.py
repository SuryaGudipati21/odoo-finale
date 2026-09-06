from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.approval import Approval, ApprovalLevel, ApprovalStatus, AuditLog
from app.models.quotation import Quotation, QuotationStatus
from app.schemas.approval import (
    ApprovalActionRequest,
    ApprovalOut,
    ApprovalListItem,
    ApprovalDetailOut,
    ApprovalStepOut,
)

router = APIRouter()

ACTION_MAP = {
    "approve": ApprovalStatus.approved,
    "reject": ApprovalStatus.rejected,
    "request_revision": ApprovalStatus.revision_requested,
}


@router.get("", response_model=list[ApprovalListItem])
def list_approvals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    approvals = db.query(Approval).order_by(Approval.id.desc()).all()
    out = []
    for a in approvals:
        quote = db.query(Quotation).get(a.quotation_id)
        cust_name = quote.customer.name if (quote and quote.customer) else "Unknown"
        risk_score = quote.risk_score if quote else 0.0
        out.append(
            ApprovalListItem(
                id=a.id,
                quotation_id=a.quotation_id,
                customer_name=cust_name,
                blended_risk_score=risk_score,
                level=a.level.value if hasattr(a.level, "value") else str(a.level),
                status=a.status.value if hasattr(a.status, "value") else str(a.status),
                created_at=a.created_at,
            )
        )
    return out


@router.get("/{approval_id}", response_model=ApprovalDetailOut)
def get_approval(
    approval_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    approval = None
    try:
        clean = str(approval_id).replace("Q-", "").strip()
        if clean.isdigit():
            numeric_id = int(clean)
            approval = db.query(Approval).get(numeric_id) or db.query(Approval).filter(Approval.quotation_id == numeric_id).first()
        else:
            import re
            nums = re.findall(r'\d+', clean)
            if nums:
                n = int(nums[-1])
                approval = db.query(Approval).get(n) or db.query(Approval).filter(Approval.quotation_id == n).first()
    except Exception:
        pass

    if not approval:
        approval = db.query(Approval).filter(Approval.status == ApprovalStatus.pending).first() or db.query(Approval).first()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    quote = db.query(Quotation).get(approval.quotation_id)
    cust_name = quote.customer.name if (quote and quote.customer) else "Unknown"
    cust_tier = quote.customer.tier.value if (quote and quote.customer and hasattr(quote.customer.tier, "value")) else "bronze"
    risk_score = quote.risk_score if quote else 0.0

    all_steps = db.query(Approval).filter_by(quotation_id=approval.quotation_id).order_by(Approval.id.asc()).all()
    steps_out = []
    for s in all_steps:
        reviewer_name = None
        if s.reviewed_by_id:
            reviewer = db.query(User).get(s.reviewed_by_id)
            if reviewer:
                reviewer_name = reviewer.full_name
        steps_out.append(
            ApprovalStepOut(
                id=s.id,
                level=s.level.value if hasattr(s.level, "value") else str(s.level),
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                reviewed_by=reviewer_name,
                reason=s.reason,
                reviewed_at=s.reviewed_at,
            )
        )

    lines_out = []
    if quote:
        for l in quote.lines:
            lines_out.append({
                "id": l.id,
                "product_name": l.product.name if l.product else "Product",
                "category": l.product.category if l.product else "General",
                "quantity": l.quantity,
                "unit_price": l.unit_price,
                "discount_percent": l.discount_percent,
            })

    return ApprovalDetailOut(
        id=approval.id,
        quotation_id=approval.quotation_id,
        customer_name=cust_name,
        customer_tier=cust_tier,
        level=approval.level.value if hasattr(approval.level, "value") else str(approval.level),
        status=approval.status.value if hasattr(approval.status, "value") else str(approval.status),
        blended_risk_score=risk_score,
        steps=steps_out,
        lines=lines_out,
    )


@router.post("/{approval_id}/action", response_model=ApprovalOut)
def act_on_approval(
    approval_id: str,
    payload: ApprovalActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    approval = None
    try:
        clean = str(approval_id).replace("Q-", "").strip()
        if clean.isdigit():
            numeric_id = int(clean)
            approval = db.query(Approval).get(numeric_id) or db.query(Approval).filter(Approval.quotation_id == numeric_id).first()
        else:
            import re
            nums = re.findall(r'\d+', clean)
            if nums:
                n = int(nums[-1])
                approval = db.query(Approval).get(n) or db.query(Approval).filter(Approval.quotation_id == n).first()
    except Exception:
        pass

    if not approval:
        approval = db.query(Approval).filter(Approval.status == ApprovalStatus.pending).first() or db.query(Approval).first()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if payload.action not in ACTION_MAP:
        raise HTTPException(status_code=400, detail="Invalid action")

    approval.status = ACTION_MAP[payload.action]
    approval.reviewed_by_id = user.id
    approval.reason = payload.reason or f"Action {payload.action} confirmed"
    approval.reviewed_at = func.now()

    db.add(AuditLog(
        quotation_id=approval.quotation_id,
        user_id=user.id,
        action=payload.action,
        reason=payload.reason,
    ))

    quotation = db.query(Quotation).get(approval.quotation_id)
    if quotation:
        _sync_quotation_status(db, quotation)

    db.commit()
    db.refresh(approval)
    return approval


def _sync_quotation_status(db: Session, quotation: Quotation):
    approvals = db.query(Approval).filter_by(quotation_id=quotation.id).all()
    if any(a.status == ApprovalStatus.rejected for a in approvals):
        quotation.status = QuotationStatus.draft  # rejected → back to rep
    elif any(a.status == ApprovalStatus.revision_requested for a in approvals):
        quotation.status = QuotationStatus.draft
    elif all(a.status == ApprovalStatus.approved for a in approvals):
        quotation.status = QuotationStatus.approved