"""Authentication endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.enums import UserRole
from app.core.security import hash_password
from app.models import User
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenOut, UserOut
from app.services.auth_service import authenticate, get_current_user, issue_tokens, resolve_refresh_user

router = APIRouter(prefix="/auth", tags=["Auth"])

_ALLOWED_SIGNUP_ROLES = {UserRole.CANDIDATE, UserRole.RECRUITER}


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> User:
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    role = payload.role if payload.role in _ALLOWED_SIGNUP_ROLES else UserRole.CANDIDATE
    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        hashed_password=hash_password(payload.password),
        role=role,
        company_name=(payload.company_name.strip() if payload.company_name else None),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
def login_form(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """OAuth2 password flow (email goes in the *username* field) — powers Swagger auth."""
    user = authenticate(db, form.username, form.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return issue_tokens(user)


@router.post("/login-json", response_model=TokenOut)
def login_json(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    user = authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return issue_tokens(user)


@router.post("/refresh", response_model=TokenOut)
def refresh(payload: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    user = resolve_refresh_user(db, payload.refresh_token)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    return issue_tokens(user)


@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user
