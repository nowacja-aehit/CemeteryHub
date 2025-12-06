import sqlite3

db_path = 'cemetery.db'
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(service_request)")
    columns = cursor.fetchall()
    print("Columns in 'service_request' table:")
    for col in columns:
        print(col)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
