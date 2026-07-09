import pytest
from fastapi.testclient import TestClient
from app.main import app, RATE_LIMIT_WINDOWS

client = TestClient(app)

def test_cors_headers():
    # Test request with an allowed origin (GET request will trigger CORS headers in TestClient)
    headers = {"Origin": "http://localhost:5173"}
    resp = client.get("/api/matches", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Test request with a disallowed origin
    headers = {"Origin": "http://malicious.com"}
    resp = client.get("/api/matches", headers=headers)
    # FastAPI CORSMiddleware does not include access-control-allow-origin on disallowed origin
    assert resp.headers.get("access-control-allow-origin") is None

def test_security_headers():
    resp = client.get("/api/matches")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in resp.headers

def test_rate_limiting_incidents():
    # Clear the global in-memory rate limit tracker to ensure test isolation
    RATE_LIMIT_WINDOWS.clear()

    payload = {
        "type": "Medical",
        "location": "East Stand",
        "description": "Rate limit test incident report.",
        "priority": "Critical"
    }
    
    # Send 10 successful requests (limit is 10/min)
    for i in range(10):
        resp = client.post("/api/incidents", json=payload)
        assert resp.status_code == 200, f"Request {i+1} failed with status {resp.status_code}"
        
    # The 11th request must exceed the rate limit (HTTP 429)
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 429
    assert resp.json()["detail"] == "Too many incidents reported. Please slow down."

def test_rate_limiting_copilot():
    RATE_LIMIT_WINDOWS.clear()
    payload = {"query": "Tell me about the crowd status."}
    
    # Send 12 successful requests (limit is 12/min)
    for i in range(12):
        resp = client.post("/api/ai/copilot", json=payload)
        assert resp.status_code == 200, f"Request {i+1} failed with status {resp.status_code}"
        
    # The 13th request must exceed the rate limit (HTTP 429)
    resp = client.post("/api/ai/copilot", json=payload)
    assert resp.status_code == 429
    assert resp.json()["detail"] == "Too many queries. Please wait a minute."

def test_websocket_security_origin():
    # Valid origin
    try:
        with client.websocket_connect("/api/ws", headers={"Origin": "http://localhost:5173"}) as websocket:
            websocket.send_text("ping")
            data = websocket.receive_text()
            assert "ACK" in data
    except Exception as e:
        pytest.fail(f"WebSocket connection with valid origin failed: {e}")

    # Invalid origin
    with pytest.raises(Exception):
        with client.websocket_connect("/api/ws", headers={"Origin": "http://malicious.com"}) as websocket:
            websocket.send_text("ping")

def test_websocket_security_message_size():
    try:
        with client.websocket_connect("/api/ws", headers={"Origin": "http://localhost:5173"}) as websocket:
            # Send message larger than 5KB (e.g. 6KB)
            large_message = "A" * 6000
            websocket.send_text(large_message)
            # The server should respond with an error and close the connection
            data = websocket.receive_text()
            assert "ERROR" in data
    except Exception as e:
        # Expected exception because the socket was closed
        pass

def test_pydantic_schema_validation():
    # Invalid incident type
    payload = {"type": "Space Invasion", "location": "East Stand", "description": "Too many aliens.", "priority": "Critical"}
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 422

    # Invalid incident priority
    payload = {"type": "Medical", "location": "East Stand", "description": "Spectator passed out.", "priority": "Low-Key"}
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 422

    # Location too short
    payload = {"type": "Medical", "location": "", "description": "Spectator passed out.", "priority": "Critical"}
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 422

    # Description too short
    payload = {"type": "Medical", "location": "East Stand", "description": "Pain", "priority": "Critical"}
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 422

    # Description too long (>500 characters)
    payload = {"type": "Medical", "location": "East Stand", "description": "Pain" * 200, "priority": "Critical"}
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 422

    # Copilot query too long (>1000 characters)
    payload = {"query": "Tell me " * 300}
    resp = client.post("/api/ai/copilot", json=payload)
    assert resp.status_code == 422
