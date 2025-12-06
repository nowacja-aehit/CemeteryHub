import sqlite3
import os

# Adjust path to point to the correct location of cemetery.db
# Assuming this script is in python/scripts/ and db is in python/api/
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'api', 'cemetery.db'))

def update_schema():
    print(f"Łączenie z bazą danych w: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE section ADD COLUMN total_rows INTEGER DEFAULT 4")
        print("Dodano kolumnę total_rows do tabeli section")
    except sqlite3.OperationalError as e:
        print(f"Błąd dodawania total_rows (może już istnieć): {e}")

    try:
        cursor.execute("ALTER TABLE section ADD COLUMN total_cols INTEGER DEFAULT 6")
        print("Dodano kolumnę total_cols do tabeli section")
    except sqlite3.OperationalError as e:
        print(f"Błąd dodawania total_cols (może już istnieć): {e}")
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_schema()
