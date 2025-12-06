import unittest
import json
import urllib.request
import urllib.error

class TestServices(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api"

    def test_public_services(self):
        """Test fetching public services"""
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/services") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
        except urllib.error.URLError as e:
            self.fail(f"Request failed: {e}")

    def test_admin_service_lifecycle(self):
        """Test create, update, delete service"""
        # Create
        payload = json.dumps({
            "name": "Test Service",
            "slug": "test-service",
            "price": 100.0,
            "category": "primary"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/services",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
                data = json.loads(response.read().decode())
                service_id = data['id']
                self.assertEqual(data['name'], "Test Service")
        except urllib.error.URLError as e:
            self.fail(f"Create failed: {e}")

        # Update
        payload = json.dumps({
            "price": 150.0
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/services/{service_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['price'], 150.0)
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/services/{service_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
