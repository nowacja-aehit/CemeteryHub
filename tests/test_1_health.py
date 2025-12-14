import unittest
import os
import json
import urllib.request
import urllib.error

class TestSystemHealth(unittest.TestCase):
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")
    if not BASE_URL.endswith("/api"):
        BASE_URL = f"{BASE_URL}/api"

    def test_system_info(self):
        """Test if system info endpoint is accessible"""
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/dev/system-info") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIn('os', data)
                self.assertIn('python_version', data)
        except urllib.error.URLError as e:
            self.fail(f"Could not connect to server: {e}")

if __name__ == '__main__':
    unittest.main()
