import sqlite3
import os

DB_PATH = 'cemetery.db'

def add_column():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE contact_message ADD COLUMN admin_notes TEXT")
        print("Column 'admin_notes' added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column 'admin_notes' already exists.")
        else:
            print(f"Error adding column: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_column()
