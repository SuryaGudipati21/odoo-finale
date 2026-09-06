from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = HTTPBearer(auto_error=False)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = creds.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        parsed_user_id = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == parsed_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive")
    return user


def require_role(*allowed_roles):
    roles = []
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            roles.extend(r)
        else:
            roles.append(r)

    def checker(user: User = Depends(get_current_user)) -> User:
        user_role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
        if user_role_val not in roles:
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
        if not customer_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        parsed_customer_id = int(customer_id)
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    customer = db.query(Customer).filter(Customer.id == parsed_customer_id).first()
    if not customer:
        raise HTTPException(status_code=401, detail="Customer not found")
    return customer