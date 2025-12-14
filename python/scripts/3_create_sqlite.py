import os
import sys

def run():
    # Force SQLite by removing Azure env var for this process
    if "AZURE_MYSQL_CONNECTIONSTRING" in os.environ:
        del os.environ["AZURE_MYSQL_CONNECTIONSTRING"]

    # Add api directory to path
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../api")))
    
    print("Initializing SQLite database via app context...")
    try:
        from app import app, db
        with app.app_context():
            db.create_all()
            print("SUCCESS: SQLite database created and initialized.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run()