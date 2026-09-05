from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        token = creds.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*allowed_roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role.value not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not authorized")
        return user
    return checker


def get_current_customer(creds: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Customer:
    try:
        token = creds.credentials
        payload = decode_access_token(token)
        if payload.get("type") != "customer":
            raise HTTPException(status_code=403, detail="Not a customer token")
        customer_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    customer = db.query(Customer).filter(Customer.id == int(customer_id)).first()
    if not customer:
        raise HTTPException(status_code=401, detail="Customer not found")
    return customer