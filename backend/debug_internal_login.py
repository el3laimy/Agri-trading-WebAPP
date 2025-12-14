from fastapi.testclient import TestClient
from app.main import app
import sys

client = TestClient(app)

print("Attempting login via TestClient...")
try:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Exception occurred: {e}")
    import traceback
    traceback.print_exc()
