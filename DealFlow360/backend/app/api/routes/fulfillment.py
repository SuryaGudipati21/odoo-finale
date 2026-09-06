from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.warehouse import Stock, FulfillmentOrder, WarehouseAllocation, FulfillmentStatus
from app.models.quotation import Quotation
from app.schemas.fulfillment import (
    StockOut,
    FulfillmentOrderOut,
    AllocationOut,
    ManualOverrideRequest,
)

router = APIRouter()


def _order_to_out(order: FulfillmentOrder) -> FulfillmentOrderOut:
    return FulfillmentOrderOut(
        id=order.id,
        quotation_id=order.quotation_id,
        customer_name=order.quotation.customer.name,
        status=order.status.value,
        allocations=[
            AllocationOut(
                id=a.id,
                warehouse_id=a.warehouse_id,
                warehouse_name=a.warehouse.name,
                quantity=a.quantity,
                cost=a.cost,
            )
            for a in order.allocations
        ],
    )


@router.get("/stock", response_model=list[StockOut])
def list_stock(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Stock).all()
    return [
        StockOut(
            warehouse_id=s.warehouse_id,
            warehouse_name=s.warehouse.name,
            product_id=s.product_id,
            product_name=s.product.name,
            qty_in_stock=s.qty_in_stock,
            qty_reserved=s.qty_reserved,
            qty_available=s.qty_in_stock - s.qty_reserved,
        )
        for s in rows
    ]


@router.get("/orders", response_model=list[FulfillmentOrderOut])
def list_orders(status: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(FulfillmentOrder)
    if status and status.lower() != "all":
        query = query.filter(FulfillmentOrder.status == status)
    orders = query.all()
    return [_order_to_out(o) for o in orders]


@router.get("/orders/{order_id}", response_model=FulfillmentOrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = None
    try:
        numeric_id = int(str(order_id).replace("Q-", "").strip())
        order = db.query(FulfillmentOrder).get(numeric_id)
        if not order:
            order = db.query(FulfillmentOrder).filter(FulfillmentOrder.quotation_id == numeric_id).first()
    except (ValueError, TypeError):
        pass

    if not order:
        raise HTTPException(status_code=404, detail="Fulfillment order not found")
    return _order_to_out(order)


@router.post("/orders/{order_id}/accept", response_model=FulfillmentOrderOut)
def accept_suggested_split(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_manager", "finance", "admin")),
):
    order = None
    try:
        numeric_id = int(str(order_id).replace("Q-", "").strip())
        order = db.query(FulfillmentOrder).get(numeric_id)
        if not order:
            order = db.query(FulfillmentOrder).filter(FulfillmentOrder.quotation_id == numeric_id).first()
    except (ValueError, TypeError):
        pass

    if not order:
        raise HTTPException(status_code=404, detail="Fulfillment order not found")

    for alloc in order.allocations:
        stock = (
            db.query(Stock)
            .filter_by(warehouse_id=alloc.warehouse_id, product_id=alloc.product_id)
            .first()
        )
        if not stock or stock.qty_in_stock - stock.qty_reserved < alloc.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock at warehouse {alloc.warehouse_id}")
        stock.qty_in_stock -= alloc.quantity
        stock.qty_reserved = max(0, stock.qty_reserved - alloc.quantity)

    order.status = FulfillmentStatus.fulfilled
    db.commit()
    db.refresh(order)
    return _order_to_out(order)


@router.post("/orders/{order_id}/override", response_model=FulfillmentOrderOut)
def manual_override(
    order_id: str,
    payload: ManualOverrideRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_manager", "finance", "admin")),
):
    order = None
    try:
        numeric_id = int(str(order_id).replace("Q-", "").strip())
        order = db.query(FulfillmentOrder).get(numeric_id)
        if not order:
            order = db.query(FulfillmentOrder).filter(FulfillmentOrder.quotation_id == numeric_id).first()
    except (ValueError, TypeError):
        pass

    if not order:
        raise HTTPException(status_code=404, detail="Fulfillment order not found")

    product_id = order.allocations[0].product_id if order.allocations else None
    order.allocations.clear()
    db.flush()

    for a in payload.allocations:
        db.add(WarehouseAllocation(
            fulfillment_order_id=order.id,
            warehouse_id=a.warehouse_id,
            product_id=product_id,
            quantity=a.quantity,
            cost=a.cost,
        ))

    total_allocated = sum(a.quantity for a in payload.allocations)
    order.status = (
        FulfillmentStatus.backorder if total_allocated == 0 else FulfillmentStatus.split_pending
    )
    db.commit()
    db.refresh(order)
    return _order_to_out(order)


from pydantic import BaseModel
from app.models.warehouse import Warehouse

class WarehouseCreate(BaseModel):
    name: str

class WarehouseOut(BaseModel):
    id: int
    name: str

@router.get("/warehouses", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db)):
    whs = db.query(Warehouse).all()
    return [WarehouseOut(id=w.id, name=w.name) for w in whs]

@router.post("/warehouses", response_model=WarehouseOut)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "sales_manager")),
):
    existing = db.query(Warehouse).filter_by(name=payload.name).first()
    if existing:
        return WarehouseOut(id=existing.id, name=existing.name)
    w = Warehouse(name=payload.name)
    db.add(w)
    db.commit()
    db.refresh(w)
    return WarehouseOut(id=w.id, name=w.name)

