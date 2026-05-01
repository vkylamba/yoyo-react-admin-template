import argparse
import getpass

from database import SessionLocal
from models import User
from utils.seeding import ADMIN_EMAIL
from utils.security import hash_password


def set_admin_password(email: str, password: str) -> int:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User not found for email: {email}")
            return 1

        user.password_hash = hash_password(password)
        user.can_login = True
        user.is_active = True
        db.commit()
        print(f"Password updated for: {email}")
        return 0
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Management commands")
    subparsers = parser.add_subparsers(dest="command")

    set_admin_password_parser = subparsers.add_parser(
        "set-admin-password",
        help="Set password for an admin/login user",
    )
    set_admin_password_parser.add_argument(
        "--email",
        default=ADMIN_EMAIL,
        help=f"User email (default: {ADMIN_EMAIL})",
    )
    set_admin_password_parser.add_argument(
        "--password",
        default=None,
        help="New password (if omitted, you will be prompted)",
    )

    args = parser.parse_args()

    if args.command == "set-admin-password":
        password = args.password or getpass.getpass("New password: ")
        if not password or not password.strip():
            print("Password cannot be empty")
            return 1
        return set_admin_password(args.email, password.strip())

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
