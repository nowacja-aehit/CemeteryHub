import unittest
import os
import json
import urllib.request
import urllib.error

class TestMessages(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
    if not BASE_URL.endswith("/api"):
        BASE_URL = f"{BASE_URL}/api"

    def test_message_lifecycle(self):
        """Test create message and admin management"""
        # Create (Public)
        payload = json.dumps({
            "name": "Test User",
            "email": "test@example.com",
            "phone": "123456789",
            "message": "Hello World"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/contact",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
        except urllib.error.URLError as e:
            self.fail(f"Create failed: {e}")

        # List (Admin)
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/contact") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
                if len(data) > 0:
                    msg_id = data[-1]['id']
                else:
                    self.fail("No messages found after creation")
        except urllib.error.URLError as e:
            self.fail(f"List failed: {e}")

        # Update (Admin)
        payload = json.dumps({
            "status": "read"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/contact/{msg_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['status'], "read")
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete (Admin)
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/contact/{msg_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
