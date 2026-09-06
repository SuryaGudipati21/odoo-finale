from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "sales_rep"  # sales_rep, sales_manager, finance, admin, customer


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    id: int
    name: str
    email: str
    tier: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut | None = None


class PortalLoginRequest(BaseModel):
    email: str
    password: str


class PortalTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerOut | None = None