import unittest
import sys
import os
import time
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from python.api.app import app, db, Grave

class TestPerformance(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()
            # Seed with data
            graves = [
                Grave(name=f"Person {i}", section="A", row=str(i), plot=str(i))
                for i in range(1000)
            ]
            db.session.bulk_save_objects(graves)
            db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_search_performance(self):
        """Benchmark search endpoint response time"""
        start_time = time.time()
        # Simulate a search query
        response = self.app.get('/api/graves?search=Person')
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"\nSearch 1000 records took: {duration:.4f} seconds")
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(duration, 0.5, "Search should take less than 500ms")

    def test_map_data_performance(self):
        """Benchmark map data retrieval"""
        start_time = time.time()
        response = self.app.get('/api/graves') # Assuming this returns all for map
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"\nMap data retrieval (1000 records) took: {duration:.4f} seconds")
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(duration, 1.0, "Map data load should take less than 1s")

if __name__ == '__main__':
    unittest.main()
