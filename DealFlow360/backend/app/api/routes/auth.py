from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerTier
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
    PortalLoginRequest,
    PortalTokenResponse,
    CustomerOut,
)
from app.core.security import verify_password, hash_password, create_access_token

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if payload.role == "customer":
        existing = db.query(Customer).filter(Customer.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        customer = Customer(
            name=payload.full_name,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            tier=CustomerTier.bronze,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        token = create_access_token({"sub": str(customer.id), "type": "customer"})
        user_out = UserOut(id=customer.id, email=customer.email, full_name=customer.name, role="customer")
        return TokenResponse(access_token=token, user=user_out)
    else:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        try:
            role_enum = UserRole(payload.role)
        except ValueError:
            role_enum = UserRole.sales_rep

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            role=role_enum,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        user_out = UserOut(id=user.id, email=user.email, full_name=user.full_name, role=user.role.value)
        return TokenResponse(access_token=token, user=user_out)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.is_active or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    user_out = UserOut(id=user.id, email=user.email, full_name=user.full_name, role=user.role.value)
    return TokenResponse(access_token=token, user=user_out)


@router.post("/portal-login", response_model=PortalTokenResponse)
def portal_login(payload: PortalLoginRequest, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if not customer or not verify_password(payload.password, customer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(customer.id), "type": "customer"})
    cust_out = CustomerOut(id=customer.id, name=customer.name, email=customer.email, tier=customer.tier.value)
    return PortalTokenResponse(access_token=token, customer=cust_out)