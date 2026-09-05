from pydantic import BaseModel


class WarehouseCreate(BaseModel):
    name: str
    shipping_cost_weight: float = 1.0


class StockCreate(BaseModel):
    warehouse_id: int
    product_id: int
    quantity: int


class ManualSplitLine(BaseModel):
    quotation_line_id: int
    warehouse_id: int
    quantity: int


class ManualSplitRequest(BaseModel):
    lines: list[ManualSplitLine]