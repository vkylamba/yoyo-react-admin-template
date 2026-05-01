from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyResponse,
    UserOut,
)
from utils.security import (
    create_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.username, User.can_login == True).first()  # noqa: E712
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_token(user.id, user.email)
    return {"token": token}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        firstname=body.firstname,
        lastname=body.lastname,
        company=body.company,
        is_self=True,
        can_login=True,
        is_admin=False,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id, user.email)
    return {"token": token}


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)):
    # In a stateless JWT setup, logout is handled client-side by removing the token.
    # A production system would use a token blocklist (e.g. Redis).
    return {"message": "Successfully logged out"}


@router.get("/verify", response_model=VerifyResponse)
def verify(current_user: User = Depends(get_current_user)):
    return {
        "valid": True,
        "user": UserOut.model_validate(current_user),
    }


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # In production, send a reset email with a signed token.
    user = db.query(User).filter(User.email == body.email).first()
    # Always return success to prevent email enumeration
    return {"message": "If that email is registered, a reset link has been sent"}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.token)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.password_hash = hash_password(body.password)
    db.commit()
    return {"message": "Password has been reset successfully"}
