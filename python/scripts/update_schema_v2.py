import sqlite3
import os

# Configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "python", "api", "cemetery.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check existing columns in service_request
    cursor.execute("PRAGMA table_info(service_request)")
    columns = [info[1] for info in cursor.fetchall()]

    # Add admin_notes if not exists
    if "admin_notes" not in columns:
        print("Adding 'admin_notes' column...")
        cursor.execute("ALTER TABLE service_request ADD COLUMN admin_notes TEXT")
    else:
        print("'admin_notes' column already exists.")

    # Add services column (for JSON list of services) if not exists
    if "services" not in columns:
        print("Adding 'services' column...")
        cursor.execute("ALTER TABLE service_request ADD COLUMN services TEXT")
    else:
        print("'services' column already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
