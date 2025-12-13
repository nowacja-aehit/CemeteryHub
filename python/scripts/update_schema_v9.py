import sqlite3
import os

# Ścieżka do bazy danych
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "../../cemetery.db")

def update_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Dodanie kolumny display_order do tabeli faq
        print("Dodawanie kolumny display_order do tabeli faq...")
        cursor.execute("ALTER TABLE faq ADD COLUMN display_order INTEGER DEFAULT 0")
        print("Kolumna dodana pomyślnie.")
    except sqlite3.OperationalError as e:
        print(f"Błąd (może kolumna już istnieje): {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_schema()
