import os
import sys

def run():
    if "AZURE_MYSQL_CONNECTIONSTRING" in os.environ:
        del os.environ["AZURE_MYSQL_CONNECTIONSTRING"]

    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../api")))
    
    print("Seeding SQLite database...")
    try:
        from app import app
        with app.app_context():
            client = app.test_client()
            # Call the seed endpoint
            res = client.post('/api/admin/dev/seed-data')
            if res.status_code == 200:
                print(f"SUCCESS: {res.get_json()}")
            else:
                print(f"ERROR: {res.get_json()}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run()