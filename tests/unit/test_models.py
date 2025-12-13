import unittest
import sys
import os
from datetime import datetime

# Add project root to path to allow importing python.api.app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from python.api.app import app, db, User, Grave, ServiceRequest

class TestModels(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_user_password_hashing(self):
        u = User(username='testuser')
        u.set_password('cat')
        self.assertFalse(u.check_password('dog'))
        self.assertTrue(u.check_password('cat'))

    def test_grave_to_dict(self):
        g = Grave(
            name="Jan Kowalski",
            birth_date="1900-01-01",
            death_date="1980-01-01",
            section="A",
            row="1",
            plot="1",
            coord_x=10,
            coord_y=20
        )
        data = g.to_dict()
        self.assertEqual(data['name'], "Jan Kowalski")
        self.assertEqual(data['coordinates'], "10,20")

    def test_service_request_status_normalization(self):
        req = ServiceRequest(
            grave_id=1,
            service_type="Cleaning",
            status="oczekujące"
        )
        data = req.to_dict()
        self.assertEqual(data['status'], 'pending')

        req.status = "w trakcie"
        data = req.to_dict()
        self.assertEqual(data['status'], 'in_progress')

if __name__ == '__main__':
    unittest.main()
