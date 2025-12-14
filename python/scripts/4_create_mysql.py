import os
import sys

def run():
    if "AZURE_MYSQL_CONNECTIONSTRING" not in os.environ:
        print("ERROR: AZURE_MYSQL_CONNECTIONSTRING environment variable is not set.")
        return

    # Add api directory to path
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../api")))
    
    print("Initializing MySQL database via app context...")
    try:
        from app import app, db
        with app.app_context():
            db.create_all()
            print("SUCCESS: MySQL database created and initialized.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run()