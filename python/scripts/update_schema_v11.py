import sqlite3
import os

basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, '../../cemetery.db')

NEW_COLUMNS = (
    ('services', "ALTER TABLE service_request ADD COLUMN services TEXT"),
    ('total_cost', "ALTER TABLE service_request ADD COLUMN total_cost REAL"),
    ('discount', "ALTER TABLE service_request ADD COLUMN discount REAL"),
    ('admin_notes', "ALTER TABLE service_request ADD COLUMN admin_notes TEXT")
)

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def update_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute('PRAGMA foreign_keys=OFF')
        for column, statement in NEW_COLUMNS:
            print(f"Sprawdzanie kolumny '{column}' w tabeli service_request...")
            if column_exists(cursor, 'service_request', column):
                print(f"Kolumna '{column}' już istnieje. Pomijam.")
                continue
            print(f"Dodawanie kolumny '{column}'...")
            cursor.execute(statement)
            print(f"Kolumna '{column}' dodana.")

        print("Normalizowanie statusów zgłoszeń usług...")
        cursor.execute("UPDATE service_request SET status = 'pending' WHERE LOWER(status) IN ('oczekujące', 'oczekujace')")
        cursor.execute("UPDATE service_request SET status = 'in_progress' WHERE LOWER(status) IN ('w trakcie', 'w_trakcie', 'in-progress')")
        cursor.execute("UPDATE service_request SET status = 'completed' WHERE LOWER(status) IN ('zakończone', 'zakonczone')")
    finally:
        conn.commit()
        conn.close()

if __name__ == '__main__':
    update_schema()
