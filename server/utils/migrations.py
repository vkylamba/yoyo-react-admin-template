import json
from datetime import datetime, timezone

from sqlalchemy import text

from utils.security import hash_password


def _split_name(name: str) -> tuple[str, str]:
    parts = (name or "").strip().split(maxsplit=1)
    if not parts:
        return "Person", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


def migrate_merge_users_people(engine) -> None:
    """Best-effort migration that merges legacy `people` rows into `users`.

    This migration is idempotent and safe to run on every startup.
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS app_migrations "
                "(key TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
            )
        )

        tables = {row[0] for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))}
        if "users" not in tables:
            return

        user_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "owner_user_id" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN owner_user_id INTEGER"))
        if "is_self" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_self BOOLEAN DEFAULT 0"))
        if "can_login" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN can_login BOOLEAN DEFAULT 0"))
        if "is_admin" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
        if "is_superuser" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN DEFAULT 0"))

        # Ensure existing primary users are marked as login-capable and self records.
        conn.execute(text("UPDATE users SET can_login = COALESCE(can_login, 1)"))
        conn.execute(text("UPDATE users SET is_self = CASE WHEN owner_user_id IS NULL THEN 1 ELSE is_self END"))

        already_merged = conn.execute(
            text("SELECT 1 FROM app_migrations WHERE key = 'merge_people_into_users_v1' LIMIT 1")
        ).fetchone()
        if already_merged:
            return

        if "people" not in tables:
            conn.execute(
                text("INSERT OR IGNORE INTO app_migrations (key, applied_at) VALUES (:key, :applied_at)"),
                {"key": "merge_people_into_users_v1", "applied_at": datetime.now(timezone.utc).isoformat()},
            )
            return

        people_rows = conn.execute(text("SELECT id, user_id, name, email, is_self FROM people ORDER BY id")).fetchall()
        if not people_rows:
            conn.execute(
                text("INSERT OR IGNORE INTO app_migrations (key, applied_at) VALUES (:key, :applied_at)"),
                {"key": "merge_people_into_users_v1", "applied_at": datetime.now(timezone.utc).isoformat()},
            )
            return

        id_map: dict[int, int] = {}

        for old_id, owner_user_id, name, email, is_self in people_rows:
            if is_self:
                # Map legacy self-person row to the owning user row.
                id_map[int(old_id)] = int(owner_user_id)
                conn.execute(
                    text(
                        "UPDATE users SET is_self = 1, can_login = 1 "
                        "WHERE id = :uid"
                    ),
                    {"uid": owner_user_id},
                )
                continue

            firstname, lastname = _split_name(name or "")
            safe_email = email or f"person_{old_id}_{owner_user_id}@local.invalid"

            existing = conn.execute(
                text(
                    "SELECT id FROM users "
                    "WHERE owner_user_id = :owner "
                    "AND (email = :email OR email = :safe_email) "
                    "LIMIT 1"
                ),
                {"owner": owner_user_id, "email": email, "safe_email": safe_email},
            ).fetchone()
            if existing:
                id_map[int(old_id)] = int(existing[0])
                continue

            # Attempt to preserve the legacy person ID when possible to minimize remaps.
            id_taken = conn.execute(text("SELECT 1 FROM users WHERE id = :id LIMIT 1"), {"id": old_id}).fetchone()
            created_at = datetime.now(timezone.utc).isoformat()
            no_login_hash = hash_password("__NO_LOGIN__")
            if not id_taken:
                conn.execute(
                    text(
                        "INSERT INTO users (id, owner_user_id, email, password_hash, firstname, lastname, company, "
                        "is_active, is_self, can_login, is_admin, is_superuser, created_at) "
                        "VALUES (:id, :owner, :email, :password_hash, :firstname, :lastname, NULL, 1, 0, 0, 0, 0, :created_at)"
                    ),
                    {
                        "id": old_id,
                        "owner": owner_user_id,
                        "email": safe_email,
                        "password_hash": no_login_hash,
                        "firstname": firstname,
                        "lastname": lastname,
                        "created_at": created_at,
                    },
                )
                id_map[int(old_id)] = int(old_id)
            else:
                conn.execute(
                    text(
                        "INSERT INTO users (owner_user_id, email, password_hash, firstname, lastname, company, "
                        "is_active, is_self, can_login, is_admin, is_superuser, created_at) "
                        "VALUES (:owner, :email, :password_hash, :firstname, :lastname, NULL, 1, 0, 0, 0, 0, :created_at)"
                    ),
                    {
                        "owner": owner_user_id,
                        "email": safe_email,
                        "password_hash": no_login_hash,
                        "firstname": firstname,
                        "lastname": lastname,
                        "created_at": created_at,
                    },
                )
                new_id = conn.execute(text("SELECT last_insert_rowid()")).scalar_one()
                id_map[int(old_id)] = int(new_id)

        # Remap FK-like ID references stored in data rows.
        for old_id, new_id in id_map.items():
            if old_id == new_id:
                continue
            conn.execute(text("UPDATE expenses SET paid_by_id = :new WHERE paid_by_id = :old"), {"new": new_id, "old": old_id})
            conn.execute(text("UPDATE expense_participants SET person_id = :new WHERE person_id = :old"), {"new": new_id, "old": old_id})
            conn.execute(text("UPDATE recurring_rules SET paid_by_id = :new WHERE paid_by_id = :old"), {"new": new_id, "old": old_id})

        # Remap participant_ids_json arrays in recurring rules.
        rules = conn.execute(text("SELECT id, participant_ids_json FROM recurring_rules WHERE participant_ids_json IS NOT NULL")).fetchall()
        for rule_id, raw_ids in rules:
            try:
                ids = json.loads(raw_ids)
            except Exception:
                continue
            remapped = [id_map.get(int(pid), int(pid)) for pid in ids]
            if remapped != ids:
                conn.execute(
                    text("UPDATE recurring_rules SET participant_ids_json = :val WHERE id = :id"),
                    {"val": json.dumps(remapped), "id": rule_id},
                )

        conn.execute(
            text("INSERT OR IGNORE INTO app_migrations (key, applied_at) VALUES (:key, :applied_at)"),
            {"key": "merge_people_into_users_v1", "applied_at": datetime.now(timezone.utc).isoformat()},
        )
