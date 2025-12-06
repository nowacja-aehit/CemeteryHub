import unittest
import json
import urllib.request
import urllib.error

class TestFAQ(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api"

    def test_public_faq(self):
        """Test fetching public FAQ"""
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/faqs") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
        except urllib.error.URLError as e:
            self.fail(f"Request failed: {e}")

    def test_admin_faq_lifecycle(self):
        """Test create, update, delete FAQ"""
        # Create
        payload = json.dumps({
            "question": "Test Question?",
            "answer": "Test Answer",
            "display_order": 1
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/faqs",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
                data = json.loads(response.read().decode())
                faq_id = data['id']
                self.assertEqual(data['question'], "Test Question?")
        except urllib.error.URLError as e:
            self.fail(f"Create failed: {e}")

        # Update
        payload = json.dumps({
            "question": "Updated Question?"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/faqs/{faq_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['question'], "Updated Question?")
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/faqs/{faq_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
