import sqlite3
import os

# Path to database
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, '../cemetery.db')

def update_schema():
    print(f"Updating database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Add role column to user table
    try:
        cursor.execute("ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
        print("Added 'role' column to 'user' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("'role' column already exists in 'user' table.")
        else:
            print(f"Error adding 'role' column: {e}")

    # 2. Create new tables if they don't exist
    # We can rely on app.py's db.create_all() to create missing tables, 
    # but we can also do it manually here or just run a script that imports app and calls db.create_all().
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_schema()
