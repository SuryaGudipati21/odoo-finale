from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus, PipelineStage
from app.schemas.invoice import InvoiceListItem, InvoiceOut, RecordPaymentRequest

router = APIRouter()


def _to_out(inv: Invoice) -> InvoiceOut:
    return InvoiceOut(
        id=inv.id,
        invoice_number=inv.invoice_number,
        quotation_id=inv.quotation_id,
        customer_name=inv.quotation.customer.name,
        amount=inv.amount,
        status=inv.status.value,
        pipeline_stage=inv.pipeline_stage.value,
        is_recurring=inv.is_recurring,
        due_date=inv.due_date,
        paid_at=inv.paid_at,
    )


@router.get("", response_model=list[InvoiceListItem])
def list_invoices(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invoices = db.query(Invoice).order_by(Invoice.due_date.desc()).all()
    return [
        InvoiceListItem(
            id=i.id,
            invoice_number=i.invoice_number,
            customer_name=i.quotation.customer.name,
            amount=i.amount,
            status=i.status.value,
            due_date=i.due_date,
        )
        for i in invoices
    ]


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).get(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _to_out(invoice)


@router.post("/{invoice_id}/record-payment", response_model=InvoiceOut)
def record_payment(
    invoice_id: int,
    payload: RecordPaymentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("finance", "admin")),
):
    invoice = db.query(Invoice).get(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Invoice already paid")

    invoice.status = InvoiceStatus.paid
    invoice.pipeline_stage = PipelineStage.paid
    invoice.paid_at = func.now()

    db.commit()
    db.refresh(invoice)
    return _to_out(invoice)
