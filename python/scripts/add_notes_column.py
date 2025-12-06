import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'api', 'cemetery.db')

def add_notes_column():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE service_request ADD COLUMN notes TEXT")
        print("Dodano kolumnę 'notes' do tabeli service_request.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Kolumna 'notes' już istnieje.")
        else:
            print(f"Błąd podczas dodawania kolumny: {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    add_notes_column()
