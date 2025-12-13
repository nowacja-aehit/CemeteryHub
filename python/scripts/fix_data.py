import sqlite3
import os

# Ścieżka do bazy danych
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "../../cemetery.db")

def fix_data():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Naprawianie danych...")

    # 1. Aktualizacja współrzędnych Jana Kowalskiego
    cursor.execute("UPDATE grave SET coordinates = '0,0' WHERE name = 'Jan Kowalski' AND coordinates = '10,10'")
    if cursor.rowcount > 0:
        print("Zaktualizowano współrzędne Jana Kowalskiego.")
    
    # 2. Dodanie sekcji jeśli nie istnieją
    cursor.execute("SELECT count(*) FROM section")
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("Dodawanie przykładowych sekcji...")
        cursor.execute("INSERT INTO section (name, description, rows, cols) VALUES ('A', 'Sektor główny', 4, 6)")
        cursor.execute("INSERT INTO section (name, description, rows, cols) VALUES ('B', 'Sektor boczny', 4, 6)")
        print("Dodano sekcje A i B.")
    else:
        print("Sekcje już istnieją.")

    conn.commit()
    conn.close()
    print("Zakończono.")

if __name__ == "__main__":
    fix_data()
