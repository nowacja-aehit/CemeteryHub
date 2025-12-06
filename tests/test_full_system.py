import unittest
import sys
import os
import json
from datetime import datetime

# Add python/api to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python', 'api')))

from app import app, db, User, Grave, Section, Article, Service, ServiceRequest, ContactMessage, FAQ, Reservation

class FullSystemTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        # Force in-memory DB
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()
            # Check if admin exists (in case of persistence issues or shared state)
            if not User.query.filter_by(username='admin').first():
                admin = User(username='admin', role='admin')
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    # --- Helper Methods ---
    def login_admin(self):
        return self.app.post('/api/login', json={
            'username': 'admin',
            'password': 'admin123'
        })

    # --- Scenario 1: Grave Management (Admin -> User) ---
    def test_grave_management_flow(self):
        """
        Test flow:
        1. Admin adds Section
        2. Admin adds Grave
        3. User sees Section and Grave
        4. Admin edits Grave
        5. User sees updated Grave
        6. Admin deletes Grave
        7. User sees Grave is gone
        """
        # 1. Admin adds Section
        section_data = {'name': 'A', 'description': 'Main Section', 'rows': 10, 'cols': 10}
        resp = self.app.post('/api/admin/sections', json=section_data)
        self.assertEqual(resp.status_code, 201)

        # 2. Admin adds Grave
        grave_data = {
            'name': 'Jan Kowalski',
            'birthDate': '1950-01-01',
            'deathDate': '2020-01-01',
            'section': 'A',
            'row': 1,
            'plot': 1,
            'coordinates': {'x': 0, 'y': 0}
        }
        resp = self.app.post('/api/admin/graves', json=grave_data)
        self.assertEqual(resp.status_code, 201)
        grave_id = resp.json['id']

        # 3. User sees Section and Grave
        # Check Sections
        resp = self.app.get('/api/sections') # Assuming user endpoint exists or admin endpoint is public
        # If /api/sections doesn't exist for user, we check /api/admin/sections (as frontend uses it)
        if resp.status_code == 404:
            resp = self.app.get('/api/admin/sections')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(s['name'] == 'A' for s in resp.json))

        # Check Graves
        resp = self.app.get('/api/graves')
        self.assertEqual(resp.status_code, 200)
        grave = next((g for g in resp.json if g['id'] == grave_id), None)
        self.assertIsNotNone(grave)
        self.assertEqual(grave['name'], 'Jan Kowalski')
        self.assertEqual(grave['coordinates'], '0,0')

        # 4. Admin edits Grave
        update_data = {'name': 'Jan Maria Kowalski'}
        resp = self.app.patch(f'/api/admin/graves/{grave_id}', json=update_data)
        self.assertEqual(resp.status_code, 200)

        # 5. User sees updated Grave
        resp = self.app.get('/api/graves')
        grave = next((g for g in resp.json if g['id'] == grave_id), None)
        self.assertEqual(grave['name'], 'Jan Maria Kowalski')

        # 6. Admin deletes Grave
        resp = self.app.delete(f'/api/admin/graves/{grave_id}')
        self.assertEqual(resp.status_code, 200)

        # 7. User sees Grave is gone
        resp = self.app.get('/api/graves')
        grave = next((g for g in resp.json if g['id'] == grave_id), None)
        self.assertIsNone(grave)

    # --- Scenario 2: Service Ordering (User -> Admin) ---
    def test_service_ordering_flow(self):
        """
        Test flow:
        1. Admin adds Service
        2. User sees Service
        3. User creates Service Request
        4. Admin sees Request
        5. Admin updates Request status
        """
        # Setup: Create a grave first
        self.app.post('/api/admin/graves', json={
            'name': 'Grave for Service', 'section': 'A', 'row': 1, 'plot': 1
        })
        grave_resp = self.app.get('/api/graves')
        grave_id = grave_resp.json[0]['id']

        # 1. Admin adds Service
        service_data = {
            'name': 'Cleaning',
            'slug': 'cleaning',
            'price': 150.0,
            'category': 'maintenance'
        }
        resp = self.app.post('/api/admin/services', json=service_data)
        self.assertEqual(resp.status_code, 201)

        # 2. User sees Service
        resp = self.app.get('/api/services')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(s['slug'] == 'cleaning' for s in resp.json))

        # 3. User creates Service Request
        req_data = {
            'graveId': grave_id,
            'serviceType': 'cleaning',
            'date': '2025-12-06',
            'contactName': 'User One',
            'contactEmail': 'user@example.com',
            'contactPhone': '123456789',
            'notes': 'Please be careful'
        }
        resp = self.app.post('/api/service-requests', json=req_data)
        self.assertEqual(resp.status_code, 201)

        # 4. Admin sees Request
        resp = self.app.get('/api/admin/service-requests')
        self.assertEqual(resp.status_code, 200)
        request_obj = next((r for r in resp.json if r['contactName'] == 'User One'), None)
        self.assertIsNotNone(request_obj)
        self.assertEqual(request_obj['serviceType'], 'cleaning')
        self.assertEqual(request_obj['status'], 'Oczekujące')
        self.assertEqual(request_obj['notes'], 'Please be careful') # Verify notes are visible to admin
        req_id = request_obj['id']

        # 5. Admin updates Request status
        update_data = {'status': 'W toku', 'scheduled_date': '2025-12-10'}
        resp = self.app.put(f'/api/admin/service-requests/{req_id}', json=update_data)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json['status'], 'W toku')

        # Verify persistence
        resp = self.app.get('/api/admin/service-requests')
        request_obj = next(r for r in resp.json if r['id'] == req_id)
        self.assertEqual(request_obj['status'], 'W toku')

    # --- Scenario 3: Reservations (User -> Admin) ---
    def test_reservation_flow(self):
        """
        Test flow:
        1. User submits Reservation
        2. Admin sees Reservation
        3. Admin updates status
        """
        # 1. User submits Reservation
        res_data = {
            'name': 'Reserver Name',
            'email': 'res@example.com',
            'phone': '987654321',
            'date': '2025-12-20',
            'message': 'I want a double plot'
        }
        resp = self.app.post('/api/reservations', json=res_data)
        self.assertEqual(resp.status_code, 201)

        # 2. Admin sees Reservation
        resp = self.app.get('/api/admin/reservations')
        self.assertEqual(resp.status_code, 200)
        reservation = next((r for r in resp.json if r['email'] == 'res@example.com'), None)
        self.assertIsNotNone(reservation)
        self.assertEqual(reservation['status'], 'Nowa')
        res_id = reservation['id']

        # 3. Admin updates status
        resp = self.app.put(f'/api/admin/reservations/{res_id}', json={'status': 'Potwierdzona'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json['status'], 'Potwierdzona')

    # --- Scenario 4: Knowledge Base (Admin -> User) ---
    def test_knowledge_base_flow(self):
        """
        Test flow:
        1. Admin adds Article
        2. User sees Article
        3. Admin updates Article
        4. User sees updated Article
        5. Admin deletes Article
        6. Admin adds FAQ
        7. User sees FAQ
        8. Admin updates FAQ
        9. Admin deletes FAQ
        """
        # 1. Admin adds Article
        article_data = {
            'title': 'History of Cemetery',
            'content': 'Long text...',
            'category': 'History',
            'date': '2025-01-01',
            'readTime': '5 min'
        }
        resp = self.app.post('/api/admin/articles', json=article_data)
        self.assertEqual(resp.status_code, 201)
        art_id = resp.json['id']

        # 2. User sees Article
        resp = self.app.get('/api/articles')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(a['title'] == 'History of Cemetery' for a in resp.json))

        # 3. Admin updates Article
        resp = self.app.put(f'/api/admin/articles/{art_id}', json={'title': 'Updated History'})
        self.assertEqual(resp.status_code, 200)

        # 4. User sees updated Article
        resp = self.app.get('/api/articles')
        article = next((a for a in resp.json if a['id'] == art_id), None)
        self.assertEqual(article['title'], 'Updated History')

        # 5. Admin deletes Article
        resp = self.app.delete(f'/api/admin/articles/{art_id}')
        self.assertEqual(resp.status_code, 200)
        resp = self.app.get('/api/articles')
        self.assertFalse(any(a['id'] == art_id for a in resp.json))

        # 6. Admin adds FAQ
        faq_data = {
            'question': 'Opening hours?',
            'answer': '8 AM - 8 PM'
        }
        resp = self.app.post('/api/admin/faqs', json=faq_data)
        self.assertEqual(resp.status_code, 201)
        faq_id = resp.json['id']

        # 7. User sees FAQ
        resp = self.app.get('/api/faqs')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(f['question'] == 'Opening hours?' for f in resp.json))

        # 8. Admin updates FAQ (Answer and Order)
        resp = self.app.put(f'/api/admin/faqs/{faq_id}', json={'answer': '24/7', 'display_order': 5})
        self.assertEqual(resp.status_code, 200)
        resp = self.app.get('/api/faqs')
        faq = next((f for f in resp.json if f['id'] == faq_id), None)
        self.assertEqual(faq['answer'], '24/7')
        self.assertEqual(faq['display_order'], 5)

        # 9. Admin deletes FAQ
        resp = self.app.delete(f'/api/admin/faqs/{faq_id}')
        self.assertEqual(resp.status_code, 200)
        resp = self.app.get('/api/faqs')
        self.assertFalse(any(f['id'] == faq_id for f in resp.json))

    # --- Scenario 5: Contact (User -> Admin) ---
    def test_contact_flow(self):
        """
        Test flow:
        1. User sends Contact Message
        2. Admin sees Message
        """
        # 1. User sends Contact Message
        msg_data = {
            'name': 'Contact User',
            'email': 'contact@example.com',
            'message': 'Hello admin'
        }
        resp = self.app.post('/api/contact', json=msg_data)
        self.assertEqual(resp.status_code, 201)

        # 2. Admin sees Message
        resp = self.app.get('/api/admin/contact')
        self.assertEqual(resp.status_code, 200)
        msg = next((m for m in resp.json if m['email'] == 'contact@example.com'), None)
        self.assertIsNotNone(msg)
        self.assertEqual(msg['message'], 'Hello admin')

    # --- Scenario 6: Section Management (Admin -> User) ---
    def test_section_management_flow(self):
        """
        Test flow:
        1. Admin adds Section
        2. User sees Section
        3. Admin updates Section
        4. User sees updated Section
        5. Admin deletes Section
        6. User sees Section is gone
        """
        # 1. Admin adds Section
        section_data = {'name': 'Z', 'description': 'Test Section', 'rows': 5, 'cols': 5}
        resp = self.app.post('/api/admin/sections', json=section_data)
        self.assertEqual(resp.status_code, 201)
        sec_id = resp.json['id']

        # 2. User sees Section
        resp = self.app.get('/api/sections')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(s['name'] == 'Z' for s in resp.json))

        # 3. Admin updates Section
        update_data = {'name': 'Z-Updated', 'rows': 6}
        resp = self.app.patch(f'/api/admin/sections/{sec_id}', json=update_data)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json['name'], 'Z-Updated')

        # 4. User sees updated Section
        resp = self.app.get('/api/sections')
        section = next((s for s in resp.json if s['id'] == sec_id), None)
        self.assertEqual(section['name'], 'Z-Updated')
        self.assertEqual(section['rows'], 6)

        # 5. Admin deletes Section
        resp = self.app.delete(f'/api/admin/sections/{sec_id}')
        self.assertEqual(resp.status_code, 200)

        # 6. User sees Section is gone
        resp = self.app.get('/api/sections')
        section = next((s for s in resp.json if s['id'] == sec_id), None)
        self.assertIsNone(section)

    # --- Scenario 7: Category Management (Admin -> User) ---
    def test_category_management_flow(self):
        """
        Test flow:
        1. Admin adds Category
        2. User sees Category
        3. Admin deletes Category
        """
        # 1. Admin adds Category
        cat_data = {'name': 'New Category'}
        resp = self.app.post('/api/admin/categories', json=cat_data)
        self.assertEqual(resp.status_code, 201)
        cat_id = resp.json['id']

        # 2. User sees Category
        resp = self.app.get('/api/categories')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(c['name'] == 'New Category' for c in resp.json))

        # 3. Admin deletes Category
        resp = self.app.delete(f'/api/admin/categories/{cat_id}')
        self.assertEqual(resp.status_code, 200)
        
        # Verify deletion
        resp = self.app.get('/api/categories')
        self.assertFalse(any(c['id'] == cat_id for c in resp.json))

if __name__ == '__main__':
    unittest.main()
