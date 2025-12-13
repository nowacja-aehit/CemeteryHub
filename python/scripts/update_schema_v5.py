import sqlite3
import os

# Configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api"))
DB_PATH = os.path.join(BASE_DIR, "cemetery.db")

def update_schema():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Add scheduled_date column to reservation table
        print("Adding scheduled_date column to reservation table...")
        cursor.execute("ALTER TABLE reservation ADD COLUMN scheduled_date VARCHAR(20)")
        print("Column added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column scheduled_date already exists in reservation table.")
        else:
            print(f"Error adding column: {e}")

    conn.commit()
    conn.close()
    print("Schema update completed.")

if __name__ == "__main__":
    update_schema()
