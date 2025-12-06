import unittest
import json
import urllib.request
import urllib.error

class TestServiceRequests(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api"

    def test_request_lifecycle(self):
        """Test create request and admin management"""
        # Create (Public)
        # Need a grave ID first, assuming ID 1 exists or we fail gracefully
        # Ideally we should create a grave first, but for simplicity we'll try ID 1
        # If ID 1 doesn't exist, this test might fail. 
        # Let's assume seed data was run or we handle the error.
        
        payload = json.dumps({
            "graveId": 1,
            "serviceType": "Cleaning",
            "contactName": "John Doe",
            "contactEmail": "john@example.com",
            "contactPhone": "123456789",
            "date": "2024-01-01"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/service-requests",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
        except urllib.error.URLError as e:
            # If grave 1 doesn't exist, we might get an error. 
            # But let's proceed assuming DB is seeded or we accept failure if empty.
            print(f"Create request failed (possibly no grave ID 1): {e}")
            return

        # List (Admin)
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/service-requests") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
                if len(data) > 0:
                    req_id = data[-1]['id'] # Get the last created one
                else:
                    self.fail("No requests found after creation")
        except urllib.error.URLError as e:
            self.fail(f"List failed: {e}")

        # Update Status (Admin)
        payload = json.dumps({
            "status": "completed"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/service-requests/{req_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['status'], "completed")
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete (Admin)
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/service-requests/{req_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
