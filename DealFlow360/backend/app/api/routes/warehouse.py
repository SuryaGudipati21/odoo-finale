from fastapi import APIRouter, Depends  # type: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # type: ignore[reportMissingImports]
from app.core.security import get_current_user  # type: ignore[reportMissingImports]  # reuse, don't rebuild
from app.database.session import get_db  # confirm this matches Surya's naming
from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseOut

router = APIRouter(prefix="/warehouses", tags=["warehouses"])

@router.post("", response_model=WarehouseOut)
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wh = Warehouse(**payload.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@router.get("", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Warehouse).all()