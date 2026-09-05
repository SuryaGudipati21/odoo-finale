from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.database.session import get_db
from app.core.deps import require_role
from app.models.user import User
from app.models.approval import Approval, ApprovalLevel, ApprovalStatus, AuditLog
from app.models.quotation import Quotation, QuotationStatus
from app.schemas.approval import ApprovalActionRequest, ApprovalOut

router = APIRouter()

ACTION_MAP = {
    "approve": ApprovalStatus.approved,
    "reject": ApprovalStatus.rejected,
    "request_revision": ApprovalStatus.revision_requested,
}


@router.post("/{approval_id}/action", response_model=ApprovalOut)
def act_on_approval(
    approval_id: int,
    payload: ApprovalActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_manager", "finance")),
):
    approval = db.query(Approval).get(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != ApprovalStatus.pending:
        raise HTTPException(status_code=400, detail="Approval already actioned")
    if payload.action not in ACTION_MAP:
        raise HTTPException(status_code=400, detail="Invalid action")

    # role must match the approval's required level
    if approval.level == ApprovalLevel.finance and user.role.value != "finance":
        raise HTTPException(status_code=403, detail="Only Finance can act on this approval")
    if approval.level == ApprovalLevel.manager and user.role.value not in ("sales_manager",):
        raise HTTPException(status_code=403, detail="Only Sales Manager can act on this approval")

    approval.status = ACTION_MAP[payload.action]
    approval.reviewed_by_id = user.id
    approval.reason = payload.reason
    approval.reviewed_at = func.now()

    db.add(AuditLog(
        quotation_id=approval.quotation_id,
        user_id=user.id,
        action=payload.action,
        reason=payload.reason,
    ))

    quotation = db.query(Quotation).get(approval.quotation_id)
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