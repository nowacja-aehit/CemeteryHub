import unittest
import sys
import os
import json

# Add python/api to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python', 'api')))

from app import app, db, User, Grave, Section, Article, Service, ServiceRequest, ContactMessage, FAQ, Reservation, Category

class CemeteryApiTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()
            # Create admin user if not exists
            if not User.query.filter_by(username='admin').first():
                admin = User(username='admin', role='admin')
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    # --- Auth Tests ---
    def test_login_success(self):
        response = self.app.post('/api/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])

    def test_login_failure(self):
        response = self.app.post('/api/login', json={
            'username': 'admin',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)

    # --- Graves Tests ---
    def test_get_graves(self):
        response = self.app.get('/api/graves')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, [])

    def test_add_grave(self):
        grave_data = {
            'name': 'Test Grave',
            'birthDate': '1900-01-01',
            'deathDate': '2000-01-01',
            'section': 'A',
            'row': 1,
            'plot': 1,
            'coordinates': {'x': 0, 'y': 0}
        }
        response = self.app.post('/api/admin/graves', json=grave_data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json['name'], 'Test Grave')

    # --- Sections Tests ---
    def test_add_section(self):
        section_data = {
            'name': 'Z',
            'description': 'Test Section',
            'rows': 5,
            'cols': 5
        }
        response = self.app.post('/api/admin/sections', json=section_data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json['name'], 'Z')

    # --- Articles Tests ---
    def test_add_article(self):
        article_data = {
            'title': 'Test Article',
            'content': 'Content',
            'category': 'News'
        }
        response = self.app.post('/api/admin/articles', json=article_data)
        self.assertEqual(response.status_code, 201)

    # --- Services Tests ---
    def test_add_service(self):
        service_data = {
            'name': 'Test Service',
            'slug': 'test-service',
            'price': 100.0,
            'category': 'primary'
        }
        response = self.app.post('/api/admin/services', json=service_data)
        self.assertEqual(response.status_code, 201)

    # --- Service Requests Tests ---
    def test_create_service_request(self):
        req_data = {
            'grave_id': 1,
            'customer_name': 'John Doe',
            'service_type': 'cleaning',
            'email': 'john@example.com'
        }
        response = self.app.post('/api/service-requests', json=req_data)
        self.assertEqual(response.status_code, 201)

    # --- Contact Tests ---
    def test_submit_contact(self):
        contact_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'message': 'Hello'
        }
        response = self.app.post('/api/contact', json=contact_data)
        self.assertEqual(response.status_code, 201)

    # --- FAQ Tests ---
    def test_add_faq(self):
        faq_data = {
            'question': 'Q?',
            'answer': 'A.'
        }
        response = self.app.post('/api/admin/faqs', json=faq_data)
        self.assertEqual(response.status_code, 201)

    # --- Reservations Tests ---
    def test_submit_reservation(self):
        res_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '123',
            'plot_type': 'single'
        }
        response = self.app.post('/api/reservations', json=res_data)
        self.assertEqual(response.status_code, 201)

if __name__ == '__main__':
    unittest.main()
