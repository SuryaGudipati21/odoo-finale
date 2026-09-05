from sqlalchemy.orm import Session

from app.models.warehouse import Stock


def calculate_split(db: Session, product_id: int, quantity_needed: int) -> dict:
    """
    Greedy allocation: fill from warehouses with the LOWEST shipping_cost_weight first,
    to minimize shipment cost. Returns allocations + any backorder remainder.
    """
    stocks = (
        db.query(Stock)
        .filter(Stock.product_id == product_id, Stock.quantity > 0)
        .join(Stock.warehouse)
        .order_by(Stock.warehouse.property.mapper.class_.shipping_cost_weight.asc())
        .all()
    )

    remaining = quantity_needed
    allocations = []
    for stock in stocks:
        if remaining <= 0:
            break
        take = min(stock.quantity, remaining)
        if take > 0:
            allocations.append({"warehouse_id": stock.warehouse_id, "quantity": take})
            remaining -= take

    return {
        "allocations": allocations,
        "backorder_quantity": remaining,
        "shipment_count": len(allocations),
    }