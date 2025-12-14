import unittest
import os
import json
import urllib.request
import urllib.error

class TestServiceRequests(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
    if not BASE_URL.endswith("/api"):
        BASE_URL = f"{BASE_URL}/api"

    def test_request_lifecycle(self):
        """Test create request and admin management"""
        
        # 1. Create a temporary grave first to ensure we have a valid ID and don't mess up existing data
        # This avoids the issue of trying to add a service to a non-existent grave
        grave_payload = json.dumps({
            "name": "Temp Grave For Request Test",
            "section": "T",
            "row": "1",
            "plot": "1"
        }).encode('utf-8')
        
        grave_req = urllib.request.Request(
            f"{self.BASE_URL}/admin/graves",
            data=grave_payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        grave_id = None
        try:
            with urllib.request.urlopen(grave_req) as response:
                self.assertEqual(response.status, 201)
                grave_data = json.loads(response.read().decode())
                grave_id = grave_data['id']
        except urllib.error.URLError as e:
            self.fail(f"Could not create temp grave: {e}")

        # 2. Create Service Request linked to that grave
        payload = json.dumps({
            "graveId": grave_id,
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
        
        req_id = None
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
        except urllib.error.URLError as e:
            self.fail(f"Create request failed: {e}")

        # 3. List (Admin) to get ID
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/service-requests") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                # Find our specific request by grave_id to be sure
                my_req = next((r for r in data if r['graveId'] == grave_id), None)
                if my_req:
                    req_id = my_req['id']
                else:
                    self.fail("Created request not found in list")
        except urllib.error.URLError as e:
            self.fail(f"List failed: {e}")

        # 4. Update Status (Admin)
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

        # 5. Delete Request (Admin)
        # Important: We must delete the request BEFORE deleting the grave
        # to respect Foreign Key constraints.
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/service-requests/{req_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")
            
        # 6. Delete Temp Grave
        # Now it is safe to delete the grave
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/graves/{grave_id}",
            method='DELETE'
        )
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete temp grave failed: {e}")

if __name__ == '__main__':
    unittest.main()
