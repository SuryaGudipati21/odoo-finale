from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import require_role, get_current_user
from app.models.user import User
from app.models.warehouse import Warehouse, Stock, Fulfillment, FulfillmentLine
from app.models.quotation import Quotation
from DealFlow360.backend.app.schemas.warehouse import WarehouseCreate, StockCreate, ManualSplitRequest
from app.services.warehouse_split import calculate_split

router = APIRouter()


@router.post("")
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    wh = Warehouse(**payload.dict())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("")
def list_warehouses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Warehouse).all()


@router.post("/stock")
def set_stock(payload: StockCreate, db: Session = Depends(get_db), user: User = Depends(require_role("admin", "finance"))):
    stock = Stock(**payload.dict())
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock


@router.post("/quotations/{quotation_id}/fulfillment")
def auto_fulfillment(quotation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quotation = db.query(Quotation).get(quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    fulfillment = Fulfillment(quotation_id=quotation_id)
    db.add(fulfillment)
    db.flush()

    for line in quotation.lines:
        result = calculate_split(db, line.product_id, line.quantity)
        for alloc in result["allocations"]:
            db.add(FulfillmentLine(
                fulfillment_id=fulfillment.id,
                quotation_line_id=line.id,
                warehouse_id=alloc["warehouse_id"],
                quantity_allocated=alloc["quantity"],
            ))
        if result["backorder_quantity"] > 0:
            db.add(FulfillmentLine(
                fulfillment_id=fulfillment.id,
                quotation_line_id=line.id,
                warehouse_id=None,
                quantity_allocated=result["backorder_quantity"],
                is_backorder=True,
            ))

    db.commit()
    db.refresh(fulfillment)
    return fulfillment


@router.patch("/quotations/{quotation_id}/fulfillment")
def override_fulfillment(quotation_id: int, payload: ManualSplitRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fulfillment = db.query(Fulfillment).filter_by(quotation_id=quotation_id).first()
    if not fulfillment:
        raise HTTPException(status_code=404, detail="No fulfillment exists yet")

    fulfillment.is_manual_override = True
    fulfillment.lines.clear()
    db.flush()
    for line in payload.lines:
        db.add(FulfillmentLine(
            fulfillment_id=fulfillment.id,
            quotation_line_id=line.quotation_line_id,
            warehouse_id=line.warehouse_id,
            quantity_allocated=line.quantity,
        ))
    db.commit()
    db.refresh(fulfillment)
    return fulfillment