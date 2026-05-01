from models import User
from utils.security import hash_password

ADMIN_EMAIL = "admin@yoyoproject.com"
ADMIN_PASSWORD = "test1234!"
ADMIN_FIRSTNAME = "Admin"
ADMIN_LASTNAME = "User"
ADMIN_COMPANY = "Mantis"


def ensure_admin_user(db):
    user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if not user:
        user = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            firstname=ADMIN_FIRSTNAME,
            lastname=ADMIN_LASTNAME,
            company=ADMIN_COMPANY,
            is_self=True,
            can_login=True,
            is_admin=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True

    changed = False
    if not user.can_login:
        user.can_login = True
        changed = True
    if not user.is_self:
        user.is_self = True
        changed = True
    if not user.is_admin:
        user.is_admin = True
        changed = True
    if not user.is_superuser:
        user.is_superuser = True
        changed = True
    if changed:
        db.commit()
        db.refresh(user)

    return user, False
