import unittest
import json
import urllib.request
import urllib.error

class TestArticles(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api"

    def test_public_articles(self):
        """Test fetching public articles"""
        try:
            with urllib.request.urlopen(f"{self.BASE_URL}/articles") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
        except urllib.error.URLError as e:
            self.fail(f"Request failed: {e}")

    def test_admin_article_lifecycle(self):
        """Test create, update, delete article"""
        # Create
        payload = json.dumps({
            "title": "Test Article",
            "content": "Test Content",
            "category": "News",
            "date": "2024-01-01",
            "excerpt": "Test Excerpt",
            "readTime": "5 min",
            "isVisible": True
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/articles",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 201)
                data = json.loads(response.read().decode())
                article_id = data['id']
                self.assertEqual(data['title'], "Test Article")
        except urllib.error.URLError as e:
            self.fail(f"Create failed: {e}")

        # Update
        payload = json.dumps({
            "title": "Updated Article"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/articles/{article_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['title'], "Updated Article")
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/articles/{article_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
