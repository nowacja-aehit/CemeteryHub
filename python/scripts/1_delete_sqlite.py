import os

# Path to database
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api"))
DB_PATH = os.path.join(BASE_DIR, "../../cemetery.db")

def run():
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print(f"SUCCESS: Deleted SQLite database at {DB_PATH}")
        except Exception as e:
            print(f"ERROR: Could not delete database: {e}")
    else:
        print(f"INFO: No SQLite database found at {DB_PATH}")

if __name__ == "__main__":
    run()