import unittest
import json
import urllib.request
import urllib.error

class TestUsers(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api"

    def test_user_lifecycle(self):
        """Test create, update, delete user"""
        # Create
        payload = json.dumps({
            "username": "testuser",
            "password": "password123",
            "role": "user"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/users",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
                data = json.loads(response.read().decode())
                user_id = data['id']
                self.assertEqual(data['username'], "testuser")
        except urllib.error.URLError as e:
            # If user already exists, we might fail. 
            # In a real test env, we should clean up first.
            # For now, we'll try to proceed or fail gracefully.
            self.fail(f"Create failed: {e}")

        # List
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/users") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
                # Verify our user is in the list
                found = any(u['id'] == user_id for u in data)
                self.assertTrue(found)
        except urllib.error.URLError as e:
            self.fail(f"List failed: {e}")

        # Update
        payload = json.dumps({
            "role": "admin"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/users/{user_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['role'], "admin")
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/users/{user_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
