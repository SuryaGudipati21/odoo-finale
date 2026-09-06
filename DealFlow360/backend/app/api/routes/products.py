from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.discount import DiscountTierLimit, CategoryDiscountLimit

router = APIRouter()


class ProductCreate(BaseModel):
    name: str
    category: str
    base_price: float
    unit: str = "unit"
    tax_percent: float = 0.0
    description: str | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    price: float
    unit: str
    tax_percent: float
    description: str | None = None

    class Config:
        from_attributes = True


class CustomerItemOut(BaseModel):
    id: int
    name: str
    email: str
    tier: str

    class Config:
        from_attributes = True


@router.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [
        ProductOut(
            id=p.id,
            name=p.name,
            category=p.category,
            price=p.base_price,
            unit=p.unit,
            tax_percent=p.tax_percent,
            description=p.description,
        )
        for p in products
    ]


@router.post("/products", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    prod = Product(
        name=payload.name,
        category=payload.category,
        base_price=payload.base_price,
        unit=payload.unit,
        tax_percent=payload.tax_percent,
        description=payload.description,
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return ProductOut(
        id=prod.id,
        name=prod.name,
        category=prod.category,
        price=prod.base_price,
        unit=prod.unit,
        tax_percent=prod.tax_percent,
        description=prod.description,
    )


@router.get("/customers", response_model=list[CustomerItemOut])
def list_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    return [
        CustomerItemOut(
            id=c.id,
            name=c.name,
            email=c.email,
            tier=c.tier.value if hasattr(c.tier, "value") else str(c.tier),
        )
        for c in customers
    ]


from app.models.customer import Customer, CustomerTier
from app.core.security import hash_password

class CustomerCreate(BaseModel):
    name: str
    email: str
    tier: str = "bronze"


@router.post("/customers", response_model=CustomerItemOut)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("sales_rep", "sales_manager", "admin")),
):
    existing = db.query(Customer).filter_by(email=payload.email).first()
    if existing:
        return CustomerItemOut(
            id=existing.id,
            name=existing.name,
            email=existing.email,
            tier=existing.tier.value if hasattr(existing.tier, "value") else str(existing.tier),
        )

    tier_map = {
        "bronze": CustomerTier.bronze,
        "silver": CustomerTier.silver,
        "gold": CustomerTier.gold,
    }
    tier_val = tier_map.get(payload.tier.lower(), CustomerTier.bronze)
    c = Customer(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password("pass123"),
        tier=tier_val,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return CustomerItemOut(
        id=c.id,
        name=c.name,
        email=c.email,
        tier=c.tier.value if hasattr(c.tier, "value") else str(c.tier),
    )


class DiscountLimitsUpdate(BaseModel):
    tiers: list[dict] | None = None
    categories: list[dict] | None = None


@router.get("/discounts/limits")
def get_discount_limits(db: Session = Depends(get_db)):
    tiers = db.query(DiscountTierLimit).all()
    cats = db.query(CategoryDiscountLimit).all()
    return {
        "tiers": [
            {"tier": t.tier.value if hasattr(t.tier, "value") else str(t.tier), "max_discount_percent": t.max_discount_percent}
            for t in tiers
        ],
        "categories": [
            {"category": c.category, "max_discount_percent": c.max_discount_percent}
            for c in cats
        ],
    }


@router.put("/discounts/limits")
def update_discount_limits(
    payload: DiscountLimitsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    if payload.tiers:
        for t_item in payload.tiers:
            tier_name = str(t_item.get("tier", "")).lower()
            limit = float(t_item.get("max_discount_percent", 0))
            for ct in CustomerTier:
                if ct.value == tier_name:
                    record = db.query(DiscountTierLimit).filter_by(tier=ct).first()
                    if record:
                        record.max_discount_percent = limit
                    else:
                        db.add(DiscountTierLimit(tier=ct, max_discount_percent=limit))
    if payload.categories:
        for c_item in payload.categories:
            cat_name = str(c_item.get("category", ""))
            limit = float(c_item.get("max_discount_percent", 0))
            record = db.query(CategoryDiscountLimit).filter_by(category=cat_name).first()
            if record:
                record.max_discount_percent = limit
            else:
                db.add(CategoryDiscountLimit(category=cat_name, max_discount_percent=limit))
    db.commit()
    return get_discount_limits(db)
