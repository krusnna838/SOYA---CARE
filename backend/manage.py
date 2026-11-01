#!/usr/bin/env python
import argparse
import getpass
import re
import sys
from datetime import datetime, timezone

from werkzeug.security import generate_password_hash

from app import create_app
from database import get_db, init_db


def main():
    parser = argparse.ArgumentParser(description="SoybeanCare AI Management CLI")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("init-db", help="Initialize tables and disease catalog.")

    admin_parser = subparsers.add_parser(
        "create-admin",
        help="Interactively create the first administrator without exposing a password in shell history.",
    )
    admin_parser.add_argument("--name", default="SoybeanCare Administrator", help="Administrator full name")
    admin_parser.add_argument("--email", required=True, help="Administrator email address")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return

    app = create_app()
    with app.app_context():
        if args.command == "init-db":
            init_db()
            print("Database initialized successfully.")
            return

        if args.command == "create-admin":
            email = args.email.strip().lower()
            name = args.name.strip()
            if len(name) < 2 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
                print("Error: Enter a valid administrator name and email.")
                sys.exit(1)

            conn = get_db()
            admin_count = conn.execute(
                "SELECT COUNT(*) FROM users WHERE UPPER(role) = 'ADMIN'"
            ).fetchone()[0]
            if admin_count:
                print("Error: An administrator already exists. Sign in with an existing admin account or use the authenticated admin console.")
                sys.exit(1)

            existing = conn.execute(
                "SELECT id, role FROM users WHERE LOWER(email) = ?", (email,)
            ).fetchone()
            if existing:
                print("Error: This email already belongs to an account. No existing Farmer or Expert account was changed.")
                sys.exit(1)

            password = getpass.getpass("New administrator password (12-128 characters): ")
            confirmation = getpass.getpass("Confirm administrator password: ")
            if password != confirmation:
                print("Error: Passwords do not match.")
                sys.exit(1)
            if len(password) < 12 or len(password) > 128:
                print("Error: Password must contain between 12 and 128 characters.")
                sys.exit(1)

            conn.execute(
                """INSERT INTO users (name, email, password_hash, role, created_at)
                   VALUES (?, ?, ?, 'ADMIN', ?)""",
                (name, email, generate_password_hash(password), datetime.now(timezone.utc).isoformat()),
            )
            conn.commit()
            print(f"First administrator {email} created successfully.")
            print("Keep the password private. It is not stored in the repository or command history.")


if __name__ == "__main__":
    main()
