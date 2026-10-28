#!/usr/bin/env python
import sys
import argparse
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash
from database import init_db, get_db
from app import create_app

def main():
    parser = argparse.ArgumentParser(description="SoybeanCare AI Management CLI")
    subparsers = parser.add_subparsers(dest="command")

    # init-db
    subparsers.add_parser("init-db", help="Initialize tables and default seed data.")

    # create-admin
    admin_parser = subparsers.add_parser("create-admin", help="Create a new administrator user.")
    admin_parser.add_argument("--name", default="SoybeanCare Administrator", help="Admin Full Name")
    admin_parser.add_argument("--email", required=True, help="Admin Email")
    admin_parser.add_argument("--password", required=True, help="Admin Password (min 8 chars)")

    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.command == "init-db":
            init_db()
            print("Database initialized successfully with schema and disease knowledge catalog.")

        elif args.command == "create-admin":
            if len(args.password) < 8:
                print("Error: Password must contain at least 8 characters.")
                sys.exit(1)

            email = args.email.strip().lower()
            conn = get_db()
            existing = conn.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,)).fetchone()
            if existing:
                conn.execute(
                    "UPDATE users SET name=?, password_hash=?, role='ADMIN' WHERE id=?",
                    (args.name, generate_password_hash(args.password), existing["id"])
                )
                conn.commit()
                print(f"Existing user {email} promoted to Administrator.")
            else:
                conn.execute(
                    """INSERT INTO users (name, email, password_hash, role, created_at)
                       VALUES (?, ?, ?, 'ADMIN', ?)""",
                    (args.name, email, generate_password_hash(args.password), datetime.now(timezone.utc).isoformat())
                )
                conn.commit()
                print(f"Administrator {email} created successfully.")
        else:
            parser.print_help()

if __name__ == "__main__":
    main()
