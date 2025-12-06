import sqlite3
import os

DB_PATH = 'cemetery.db'

def check_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", [t[0] for t in tables])

    # Check contact_message table
    try:
        cursor.execute("PRAGMA table_info(contact_message)")
        columns = cursor.fetchall()
        if columns:
            print("\nColumns in 'contact_message' table:")
            for col in columns:
                print(col)
        else:
            print("\nTable 'contact_message' not found.")
    except Exception as e:
        print(f"Error checking schema: {e}")
    
    conn.close()

if __name__ == "__main__":
    check_schema()
