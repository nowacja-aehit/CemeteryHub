import unittest
import json
import urllib.request
import urllib.error

class TestReservations(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api"

    def test_reservation_lifecycle(self):
        """Test create reservation and admin management"""
        # Create (Public)
        payload = json.dumps({
            "name": "Test Reserver",
            "email": "reserver@example.com",
            "phone": "987654321",
            "section": "A",
            "plot_type": "Single",
            "message": "I want a plot"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/reservations",
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
            with urllib.request.urlopen(f"{self.BASE_URL}/admin/reservations") as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertIsInstance(data, list)
                if len(data) > 0:
                    res_id = data[-1]['id']
                else:
                    self.fail("No reservations found after creation")
        except urllib.error.URLError as e:
            self.fail(f"List failed: {e}")

        # Update (Admin)
        payload = json.dumps({
            "status": "confirmed"
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/reservations/{res_id}",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
                data = json.loads(response.read().decode())
                self.assertEqual(data['status'], "confirmed")
        except urllib.error.URLError as e:
            self.fail(f"Update failed: {e}")

        # Delete (Admin)
        req = urllib.request.Request(
            f"{self.BASE_URL}/admin/reservations/{res_id}",
            method='DELETE'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.status, 200)
        except urllib.error.URLError as e:
            self.fail(f"Delete failed: {e}")

if __name__ == '__main__':
    unittest.main()
