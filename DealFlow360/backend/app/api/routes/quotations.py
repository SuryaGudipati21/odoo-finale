from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.database.session import get_db
from app.core.deps import get_current_user, require_role, get_current_customer
from app.models.user import User
from app.models.customer import Customer
from app.models.quotation import Quotation, QuotationLine, QuotationStatus
from app.models.approval import Approval, ApprovalLevel, AuditLog
from app.models.warehouse import FulfillmentOrder, WarehouseAllocation, FulfillmentStatus, Warehouse, Stock
from app.models.invoice import Invoice, InvoiceStatus, PipelineStage
from app.models.subscription import SubscriptionPlan, BillingCycle, SubscriptionStatus
from app.schemas.quotation import (
    QuotationCreate,
    QuotationOut,
    QuotationLineOut,
    QuotationListItem,
    QuotationLinesUpdate,
    QuotationStatusUpdate,
    QuotationUpdate,
)
from app.schemas.audit import AuditLogOut
from app.services.discount_risk import calculate_blended_risk
from app.services.upsell import get_suggestions
from app.models.negotiation import Negotiation
from app.schemas.negotiation import NegotiationRequest

router = APIRouter()


def _quotation_to_out(q: Quotation) -> QuotationOut:
    lines = []
    total = 0.0
    for l in q.lines:
        line_tot = round(l.unit_price * l.quantity * (1.0 - l.discount_percent / 100.0), 2)
        total += line_tot
        lines.append(
            QuotationLineOut(
                id=l.id,
                product_id=l.product_id,
                product_name=l.product.name if l.product else "",
                category=l.product.category if l.product else "",
                quantity=l.quantity,
                unit_price=l.unit_price,
                discount_percent=l.discount_percent,
                line_total=line_tot,
            )
        )
    return QuotationOut(
        id=q.id,
        customer_id=q.customer_id,
        customer_name=q.customer.name if q.customer else "",
        status=q.status.value if hasattr(q.status, "value") else str(q.status),
        risk_score=q.risk_score,
        total_amount=round(total, 2),
        created_at=q.created_at,
        lines=lines,
    )


@router.get("", response_model=list[QuotationListItem])
def list_quotations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quotes = db.query(Quotation).order_by(Quotation.id.desc()).all()
    out = []
    for q in quotes:
        total = sum(
            l.unit_price * l.quantity * (1.0 - l.discount_percent / 100.0)
            for l in q.lines
        )
        out.append(
            QuotationListItem(
                id=q.id,
                customer_id=q.customer_id,
                customer_name=q.customer.name if q.customer else "",
                status=q.status.value if hasattr(q.status, "value") else str(q.status),
                risk_score=q.risk_score,
                total_amount=round(total, 2),
                line_count=len(q.lines),
                created_at=q.created_at,
            )
        )
    return out


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
    db.flush()

    if quotation.lines:
        risk_lines = [
            {"category": l.product.category if l.product else "", "discount_percent": l.discount_percent}
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
    else:
        quotation.risk_score = 0.0
        quotation.status = QuotationStatus.draft

    db.add(AuditLog(
        quotation_id=quotation.id,
        user_id=user.id,
        action="Created quotation",
        reason=f"Initial draft with {len(quotation.lines)} lines",
    ))

    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


@router.get("/{quotation_id}", response_model=QuotationOut)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return _quotation_to_out(quotation)


@router.get("/{quotation_id}/audit-log", response_model=list[AuditLogOut])
def get_audit_log(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    logs = (
        db.query(AuditLog)
        .filter_by(quotation_id=quotation_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    out = []
    for log in logs:
        u = db.query(User).get(log.user_id)
        out.append(
            AuditLogOut(
                id=log.id,
                user_id=log.user_id,
                user_name=u.full_name if u else "User",
                action=log.action,
                reason=log.reason,
                created_at=log.created_at,
            )
        )
    return out


def _parse_quotation_status(status_str: str) -> QuotationStatus:
    status_clean = str(status_str).strip().upper()
    for s in QuotationStatus:
        if s.value == status_clean or s.name.upper() == status_clean:
            return s
    raise HTTPException(status_code=400, detail=f"Invalid quotation status: {status_str}")


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
    if quotation.status in (QuotationStatus.confirmed, QuotationStatus.fulfillment, QuotationStatus.completed):
        raise HTTPException(status_code=400, detail="Confirmed or Completed quotations cannot be modified")

    quotation.lines.clear()
    for line in payload.lines:
        quotation.lines.append(QuotationLine(**line.dict()))
    db.flush()

    risk_lines = [
        {"category": l.product.category if l.product else "", "discount_percent": l.discount_percent}
        for l in quotation.lines
    ]
    tier = quotation.customer.tier if quotation.customer else CustomerTier.bronze
    result = calculate_blended_risk(db, tier, risk_lines)
    quotation.risk_score = result["score"]

    if result["approval_required"]:
        quotation.status = QuotationStatus.pending_approval
        db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.manager))
        if result["finance_required"]:
            db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.finance))
    else:
        quotation.status = QuotationStatus.approved

    db.add(AuditLog(
        quotation_id=quotation.id,
        user_id=user.id,
        action="Updated lines",
        reason=f"Updated to {len(quotation.lines)} lines",
    ))

    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


@router.patch("/{quotation_id}/status", response_model=QuotationOut)
def update_quotation_status(
    quotation_id: int,
    payload: QuotationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    new_status = _parse_quotation_status(payload.status)
    old_status = quotation.status
    quotation.status = new_status

    if new_status in (QuotationStatus.confirmed, QuotationStatus.fulfillment, QuotationStatus.completed):
        _create_fulfillment_and_invoice_if_missing(db, quotation)
    elif new_status == QuotationStatus.pending_approval:
        appr = db.query(Approval).filter_by(quotation_id=quotation.id).first()
        if not appr:
            db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.manager))

    db.add(AuditLog(
        quotation_id=quotation.id,
        user_id=user.id,
        action="Updated status",
        reason=f"Status changed from {old_status.value if hasattr(old_status, 'value') else old_status} to {new_status.value}",
    ))
    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


@router.put("/{quotation_id}", response_model=QuotationOut)
def update_quotation(
    quotation_id: int,
    payload: QuotationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if payload.customer_id is not None:
        customer = db.query(Customer).get(payload.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        quotation.customer_id = customer.id

    if payload.lines is not None:
        quotation.lines.clear()
        for line in payload.lines:
            quotation.lines.append(QuotationLine(**line.dict()))
        db.flush()

        risk_lines = [
            {"category": l.product.category if l.product else "", "discount_percent": l.discount_percent}
            for l in quotation.lines
        ]
        tier = quotation.customer.tier if quotation.customer else CustomerTier.bronze
        result = calculate_blended_risk(db, tier, risk_lines)
        quotation.risk_score = result["score"]

    if payload.status is not None:
        new_status = _parse_quotation_status(payload.status)
        quotation.status = new_status
        if new_status in (QuotationStatus.confirmed, QuotationStatus.fulfillment, QuotationStatus.completed):
            _create_fulfillment_and_invoice_if_missing(db, quotation)
        elif new_status == QuotationStatus.pending_approval:
            appr = db.query(Approval).filter_by(quotation_id=quotation.id).first()
            if not appr:
                db.add(Approval(quotation_id=quotation.id, level=ApprovalLevel.manager))

    db.add(AuditLog(
        quotation_id=quotation.id,
        user_id=user.id,
        action="Updated quotation",
        reason="Updated quotation details via API",
    ))
    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


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
        if line:
            line.discount_percent = payload.proposed_discount_percent
    elif payload.proposed_discount_percent is not None:
        for line in quotation.lines:
            line.discount_percent = payload.proposed_discount_percent

    quotation.status = QuotationStatus.negotiation
    db.commit()
    return {"status": quotation.status.value if hasattr(quotation.status, "value") else str(quotation.status)}


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
        # Auto-create fulfillment split and invoice if not yet present
        _create_fulfillment_and_invoice_if_missing(db, quotation)

    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


def _create_fulfillment_and_invoice_if_missing(db: Session, quotation: Quotation):
    # Check fulfillment order
    existing_fo = db.query(FulfillmentOrder).filter_by(quotation_id=quotation.id).first()
    if not existing_fo:
        fo = FulfillmentOrder(quotation_id=quotation.id, status=FulfillmentStatus.split_pending)
        db.add(fo)
        db.flush()

        warehouses = db.query(Warehouse).all()
        for line in quotation.lines:
            remaining_qty = line.quantity
            for wh in warehouses:
                if remaining_qty <= 0:
                    break
                stock = db.query(Stock).filter_by(warehouse_id=wh.id, product_id=line.product_id).first()
                avail = (stock.qty_in_stock - stock.qty_reserved) if stock else 0
                if avail > 0:
                    allocated = min(avail, remaining_qty)
                    cost = round(allocated * 1.5, 2)
                    db.add(WarehouseAllocation(
                        fulfillment_order_id=fo.id,
                        warehouse_id=wh.id,
                        product_id=line.product_id,
                        quantity=allocated,
                        cost=cost,
                    ))
                    remaining_qty -= allocated

            if remaining_qty > 0 and warehouses:
                # Place remainder on primary warehouse as backorder allocation
                db.add(WarehouseAllocation(
                    fulfillment_order_id=fo.id,
                    warehouse_id=warehouses[0].id,
                    product_id=line.product_id,
                    quantity=remaining_qty,
                    cost=round(remaining_qty * 1.5, 2),
                ))

    # Check invoice
    existing_inv = db.query(Invoice).filter_by(quotation_id=quotation.id).first()
    if not existing_inv:
        tot = sum(
            l.unit_price * l.quantity * (1.0 - l.discount_percent / 100.0)
            for l in quotation.lines
        )
        inv_num = f"INV-{1000 + quotation.id}"
        db.add(Invoice(
            invoice_number=inv_num,
            quotation_id=quotation.id,
            amount=round(tot, 2),
            status=InvoiceStatus.unpaid,
            pipeline_stage=PipelineStage.invoiced,
            due_date=datetime.now(timezone.utc) + timedelta(days=30),
        ))


@router.post("/{quotation_id}/submit", response_model=QuotationOut)
def submit_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    risk_lines = [
        {"category": l.product.category if l.product else "", "discount_percent": l.discount_percent}
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

    db.add(AuditLog(
        quotation_id=quotation.id,
        user_id=user.id,
        action="Submitted quotation",
        reason="Submitted for approval or confirmation",
    ))
    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


@router.post("/{quotation_id}/confirm-rep", response_model=QuotationOut)
def confirm_quotation_rep(
    quotation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    quotation.status = QuotationStatus.confirmed
    _create_fulfillment_and_invoice_if_missing(db, quotation)
    db.add(AuditLog(
        quotation_id=quotation.id,
        user_id=user.id,
        action="Confirmed quotation",
        reason="Quotation confirmed and sent to fulfillment",
    ))
    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)


@router.delete("/{quotation_id}/lines/{line_id}", response_model=QuotationOut)
def delete_quotation_line(
    quotation_id: int,
    line_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    line = db.query(QuotationLine).filter_by(id=line_id, quotation_id=quotation.id).first()
    if line:
        db.delete(line)
        db.flush()

    risk_lines = [
        {"category": l.product.category if l.product else "", "discount_percent": l.discount_percent}
        for l in quotation.lines
    ]
    result = calculate_blended_risk(db, quotation.customer.tier, risk_lines)
    quotation.risk_score = result["score"]
    db.commit()
    db.refresh(quotation)
    return _quotation_to_out(quotation)