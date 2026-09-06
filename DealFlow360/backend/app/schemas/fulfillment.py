from pydantic import BaseModel


class StockOut(BaseModel):
    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_name: str
    qty_in_stock: int
    qty_reserved: int
    qty_available: int

    class Config:
        from_attributes = True


class AllocationOut(BaseModel):
    id: int
    warehouse_id: int
    warehouse_name: str
    quantity: int
    cost: float

    class Config:
        from_attributes = True


class FulfillmentOrderOut(BaseModel):
    id: int
    quotation_id: int
    customer_name: str
    status: str
    allocations: list[AllocationOut]

    class Config:
        from_attributes = True


class AllocationItem(BaseModel):
    warehouse_id: int
    quantity: int
    cost: float = 0.0


class ManualOverrideRequest(BaseModel):
    allocations: list[AllocationItem]
