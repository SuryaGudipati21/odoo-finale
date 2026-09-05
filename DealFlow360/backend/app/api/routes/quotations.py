from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer
from app.models.quotation import Quotation, QuotationLine, QuotationStatus
from app.models.approval import Approval, ApprovalLevel
from app.schemas.quotation import QuotationCreate, QuotationOut, QuotationLinesUpdate
from app.services.discount_risk import calculate_blended_risk
from app.models.approval import AuditLog
from app.schemas.audit import AuditLogOut
from app.services.upsell import get_suggestions
from app.models.negotiation import Negotiation
from app.schemas.negotiation import NegotiationRequest, NegotiationConfirm
from app.core.deps import get_current_customer
from app.models.customer import Customer

router = APIRouter()


@router.post("", response_model=QuotationOut)
def create_quotation(
    payload: QuotationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    customer = db.query(Customer).get(payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    quotation = Quotation(customer_id=customer.id, created_by_id=user.id, status=QuotationStatus.draft)
    for line in payload.lines:
        quotation.lines.append(QuotationLine(**line.dict()))
    db.add(quotation)
    db.flush()  # get product categories for risk calc

    risk_lines = [
        {"category": l.product.category, "discount_percent": l.discount_percent}
        for l in quotation.lines
    ]
    result = calculate_blended_risk(db, customer.tier, risk_lines)
    quotation.risk_score = result["score"]

    if result["approval_required"]:
        quotation.status = QuotationStatus.pending_approval
        db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.manager))
        if result["finance_required"]:
            db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.finance))
    else:
        quotation.status = QuotationStatus.approved

    db.commit()
    db.refresh(quotation)
    return quotation


@router.get("/{quotation_id}", response_model=QuotationOut)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation

@router.get("/{quotation_id}/audit-log", response_model=list[AuditLogOut])
def get_audit_log(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    return (
        db.query(AuditLog)
        .filter_by(quotation_id=quotation_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )

@router.patch("/{quotation_id}/lines", response_model=QuotationOut)
def update_quotation_lines(
    quotation_id: int,
    payload: QuotationLinesUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.status != QuotationStatus.draft:
        raise HTTPException(status_code=400, detail="Only DRAFT quotations can be edited")

    quotation.lines.clear()
    for line in payload.lines:
        quotation.lines.append(QuotationLine(**line.dict()))
    db.flush()

    risk_lines = [
        {"category": l.product.category, "discount_percent": l.discount_percent}
        for l in quotation.lines
    ]
    result = calculate_blended_risk(db, quotation.customer.tier, risk_lines)
    quotation.risk_score = result["score"]

    if result["approval_required"]:
        quotation.status = QuotationStatus.pending_approval
        db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.manager))
        if result["finance_required"]:
            db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.finance))
    else:
        quotation.status = QuotationStatus.approved

    db.commit()
    db.refresh(quotation)
    return quotation

@router.get("/{quotation_id}/upsell-suggestions")
def upsell_suggestions(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    product_ids = [l.product_id for l in quotation.lines]
    return get_suggestions(db, product_ids)


@router.post("/{quotation_id}/negotiate")
def negotiate(
    quotation_id: int,
    payload: NegotiationRequest,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation or quotation.customer_id != customer.id:
        raise HTTPException(status_code=404, detail="Quotation not found")

    db.add(Negotiation(
        quotation_id=quotation_id,
        quotation_line_id=payload.quotation_line_id,
        comment=payload.comment,
        proposed_discount_percent=payload.proposed_discount_percent,
    ))

    if payload.quotation_line_id and payload.proposed_discount_percent is not None:
        line = db.query(QuotationLine).get(payload.quotation_line_id)
        line.discount_percent = payload.proposed_discount_percent

    quotation.status = QuotationStatus.negotiation
    db.commit()
    return {"status": quotation.status.value}


@router.post("/{quotation_id}/confirm", response_model=QuotationOut)
def confirm_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation or quotation.customer_id != customer.id:
        raise HTTPException(status_code=404, detail="Quotation not found")

    risk_lines = [
        {"category": l.product.category, "discount_percent": l.discount_percent}
        for l in quotation.lines
    ]
    result = calculate_blended_risk(db, customer.tier, risk_lines)
    quotation.risk_score = result["score"]

    if result["approval_required"]:
        quotation.status = QuotationStatus.reapproval_required
        db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.manager))
        if result["finance_required"]:
            db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.finance))
    else:
        quotation.status = QuotationStatus.confirmed

    db.commit()
    db.refresh(quotation)
    return quotation