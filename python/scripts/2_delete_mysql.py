import os
import mysql.connector
from urllib.parse import quote_plus

def parse_mysql_kv(raw_connection):
    if not raw_connection: return None
    entries = [chunk for chunk in raw_connection.split(";") if chunk.strip()]
    kv = {}
    for entry in entries:
        if "=" not in entry: continue
        key, value = entry.split("=", 1)
        kv[key.strip().lower()] = value.strip()
    return kv

def run():
    conn_str = os.getenv("AZURE_MYSQL_CONNECTIONSTRING")
    if not conn_str:
        print("ERROR: AZURE_MYSQL_CONNECTIONSTRING environment variable is not set.")
        return

    kv = parse_mysql_kv(conn_str)
    if not kv:
        print("ERROR: Could not parse connection string.")
        return

    db_name = kv.get("database") or kv.get("db")
    host = kv.get("server") or kv.get("host") or kv.get("data source")
    user = kv.get("user id") or kv.get("user") or kv.get("uid")
    password = kv.get("password")
    port = int(kv.get("port", "3306"))

    print(f"Connecting to MySQL host: {host}...")
    
    try:
        # Connect without selecting DB to drop it
        conn = mysql.connector.connect(host=host, user=user, password=password, port=port)
        cursor = conn.cursor()
        print(f"Dropping database '{db_name}'...")
        cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`")
        print("SUCCESS: Database dropped.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run()