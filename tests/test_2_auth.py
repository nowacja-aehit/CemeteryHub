import unittest
import os
import json
import urllib.request
import urllib.error

class TestAuth(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
    if not BASE_URL.endswith("/api"):
        BASE_URL = f"{BASE_URL}/api"

    def test_admin_login(self):
        """Test admin login functionality"""
        payload = json.dumps({
            "username": "admin",
            "password": "admin123"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/login",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIn('user', data)
                self.assertEqual(data['user']['username'], 'admin')
        except urllib.error.URLError as e:
            self.fail(f"Request failed: {e}")

    def test_login_failure(self):
        """Test login with wrong credentials"""
        payload = json.dumps({
            "username": "admin",
            "password": "wrongpassword"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/login",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.fail("Should have failed with 401")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 401)
        except urllib.error.URLError as e:
            self.fail(f"Connection failed: {e}")

if __name__ == '__main__':
    unittest.main()
