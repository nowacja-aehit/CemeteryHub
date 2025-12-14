import unittest
import os
import json
import urllib.request
import urllib.error

class TestGraves(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
    if not BASE_URL.endswith("/api"):
        BASE_URL = f"{BASE_URL}/api"

    def test_get_graves(self):
        """Test fetching graves list"""
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/graves") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
        except urllib.error.URLError as e:
            self.fail(f"Could not connect to server: {e}")

if __name__ == '__main__':
    unittest.main()
