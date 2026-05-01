from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import MessageResponse, PersonCreate, PersonOut
from utils.security import get_current_user, hash_password

router = APIRouter(prefix="/people", tags=["people"])


def _to_person_out(user: User) -> PersonOut:
    return PersonOut(
        id=user.id,
        name=user.name,
        email=user.email,
        is_self=user.is_self,
    )


def _split_name(name: str) -> tuple[str, str]:
    parts = name.strip().split(maxsplit=1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


def _ensure_self(db: Session, user: User) -> None:
    """Mark the current user as the owner/self actor in merged users table."""
    changed = False
    if not user.is_self:
        user.is_self = True
        changed = True
    if user.can_login is not True:
        user.can_login = True
        changed = True
    if changed:
        db.commit()


@router.get("", response_model=List[PersonOut])
def list_people(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_self(db, current_user)
    people = db.query(User).filter(
        (User.id == current_user.id) | (User.owner_user_id == current_user.id)
    ).all()
    return [_to_person_out(p) for p in people]


@router.post("", response_model=PersonOut, status_code=status.HTTP_201_CREATED)
def create_person(
    body: PersonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firstname, lastname = _split_name(body.name)
    email = body.email or f"person_{current_user.id}_{firstname.lower() or 'user'}@local.invalid"

    person = User(
        owner_user_id=current_user.id,
        email=email,
        password_hash=hash_password("__NO_LOGIN__"),
        firstname=firstname or "Person",
        lastname=lastname,
        company=current_user.company,
        is_active=True,
        is_self=False,
        can_login=False,
        is_admin=False,
        is_superuser=False,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return _to_person_out(person)


@router.put("/{person_id}", response_model=PersonOut)
def update_person(
    person_id: int,
    body: PersonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    person = db.query(User).filter(
        User.id == person_id, User.owner_user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

    firstname, lastname = _split_name(body.name)
    person.firstname = firstname or person.firstname
    person.lastname = lastname
    if body.email:
        person.email = body.email

    db.commit()
    db.refresh(person)
    return _to_person_out(person)


@router.delete("/{person_id}", response_model=MessageResponse)
def delete_person(
    person_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    person = db.query(User).filter(
        User.id == person_id, User.owner_user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    db.delete(person)
    db.commit()
    return {"message": "Person deleted"}
