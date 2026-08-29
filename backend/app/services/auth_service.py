"""Authentication service: current-user resolution and role guards."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.enums import UserRole
from app.core.security import create_access_token, create_refresh_token, get_token_subject, verify_password
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


def issue_tokens(user: User) -> dict:
    sub = str(user.id)
    return {
        "access_token": create_access_token(sub),
        "refresh_token": create_refresh_token(sub),
        "token_type": "bearer",
        "user": user,
    }


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    subject = get_token_subject(token, expected_type="access")
    if subject is None:
        raise invalid
    try:
        user_id = int(subject)
    except ValueError:
        raise invalid from None
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise invalid
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user

    return checker


RequireCandidate = Annotated[User, Depends(require_roles(UserRole.CANDIDATE))]
RequireRecruiter = Annotated[User, Depends(require_roles(UserRole.RECRUITER, UserRole.ADMIN))]


def resolve_refresh_user(db: Session, refresh_token: str) -> User | None:
    subject = get_token_subject(refresh_token, expected_type="refresh")
    if subject is None:
        return None
    try:
        user_id = int(subject)
    except ValueError:
        return None
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user
