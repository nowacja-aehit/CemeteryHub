from python.api.app import app, db, ContactMessage
from datetime import datetime

def test_add_message():
    with app.app_context():
        try:
            msg = ContactMessage(
                name="Debug User",
                email="debug@example.com",
                phone="123456789",
                message="Debug message",
                status="Nowa",
                created_at=datetime.utcnow()
            )
            db.session.add(msg)
            db.session.commit()
            print("Message added successfully!")
        except Exception as e:
            print(f"Error adding message: {e}")

if __name__ == "__main__":
    test_add_message()
