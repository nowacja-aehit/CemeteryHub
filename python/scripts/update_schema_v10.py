import sqlite3
import os

# Ścieżka do bazy danych
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "../../cemetery.db")

def update_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Dodanie kolumny scheduled_date do tabeli service_request
        print("Dodawanie kolumny scheduled_date do tabeli service_request...")
        cursor.execute("ALTER TABLE service_request ADD COLUMN scheduled_date TEXT")
        print("Kolumna dodana pomyślnie.")
    except sqlite3.OperationalError as e:
        print(f"Błąd (może kolumna już istnieje): {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_schema()
