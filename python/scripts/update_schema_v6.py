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
        # Create Section table
        print("Creating Section table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS section (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT
            )
        """)
        
        # Seed initial sections if empty
        cursor.execute("SELECT count(*) FROM section")
        if cursor.fetchone()[0] == 0:
            print("Seeding initial sections A and B...")
            cursor.execute("INSERT INTO section (name, description) VALUES ('A', 'Main Section')")
            cursor.execute("INSERT INTO section (name, description) VALUES ('B', 'North Section')")
            
        print("Section table created and seeded.")
        
    except sqlite3.Error as e:
        print(f"Error updating schema: {e}")

    conn.commit()
    conn.close()
    print("Schema update completed.")

if __name__ == "__main__":
    update_schema()
