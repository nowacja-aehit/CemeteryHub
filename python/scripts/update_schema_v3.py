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

    # Add discount if not exists
    if "discount" not in columns:
        print("Adding 'discount' column...")
        cursor.execute("ALTER TABLE service_request ADD COLUMN discount REAL DEFAULT 0.0")
    else:
        print("'discount' column already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
