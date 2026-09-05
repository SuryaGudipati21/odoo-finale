from pydantic import BaseModel

class WarehouseCreate(BaseModel):
    name: str
    shipping_cost_weight: float = 1.0

class WarehouseOut(WarehouseCreate):
    id: int
    class Config:
        from_attributes = True