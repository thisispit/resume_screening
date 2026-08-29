"""Auth schemas."""

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserCreate, UserOut


class RegisterRequest(UserCreate):
    pass


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


__all__ = ["RegisterRequest", "LoginRequest", "TokenOut", "RefreshRequest"]
