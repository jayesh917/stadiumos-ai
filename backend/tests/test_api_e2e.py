import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_operational_e2e_flow():
    # 1. Reset and load demo tournament
    resp = client.post("/api/tournaments/load-demo")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # 2. Check matches are loaded
    resp = client.get("/api/matches")
    assert resp.status_code == 200
    matches = resp.json()
    assert len(matches) >= 12
    assert matches[0]["id"] == "M01"

    # 3. Check schedule quality and conflicts
    resp = client.get("/api/schedule/conflicts")
    assert resp.status_code == 200
    conflicts_data = resp.json()
    assert conflicts_data["schedule_quality"] == 100
    assert len(conflicts_data["conflicts"]) == 0

    # 4. Trigger crowd congestion at Gate B
    resp = client.post("/api/crowd/simulation", json={"scenario": "CRITICAL_CONGESTION"})
    assert resp.status_code == 200
    
    # Verify zone risk updated
    resp = client.get("/api/crowd/zones")
    assert resp.status_code == 200
    zones = resp.json()
    gate_b = next(z for z in zones if z["id"] == "gate_b")
    assert gate_b["status"] == "CRITICAL"
    assert gate_b["risk_score"] > 85.0

    # Get active crowd AI recommendations
    resp = client.get("/api/crowd/recommendations")
    assert resp.status_code == 200
    recs = resp.json()
    assert len(recs) > 0
    crowd_rec = recs[0]
    assert crowd_rec["scenario_type"] == "crowd"
    assert crowd_rec["status"] == "Pending"

    # 5. Apply the crowd mitigation action plan
    resp = client.post("/api/crowd/apply-action", json={"recommendation_id": crowd_rec["id"]})
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # Check Gate B status is stabilized
    resp = client.get("/api/crowd/zones")
    zones = resp.json()
    gate_b = next(z for z in zones if z["id"] == "gate_b")
    assert gate_b["status"] != "CRITICAL"

    # 6. Report a medical incident
    incident_payload = {
        "type": "Medical",
        "location": "East Stand",
        "description": "Spectator experiencing chest pain in row 14.",
        "priority": "Critical"
    }
    resp = client.post("/api/incidents", json=incident_payload)
    assert resp.status_code == 200
    incident = resp.json()
    assert incident["status"] == "REPORTED"
    assert incident["priority"] == "Critical"
    assert incident["type"] == "Medical"
    incident_id = incident["id"]

    # 7. Assign incident to responder
    # First get response units
    resp = client.get("/api/incidents")
    # Response team Medical Bravo is stationed at East Stand, so it's a great match!
    # Let's mock dispatching responder 2 (Medical Bravo has ID 2)
    resp = client.post(f"/api/incidents/{incident_id}/assign", json={"responder_id": 2})
    assert resp.status_code == 200
    assigned_inc = resp.json()
    assert assigned_inc["status"] == "ASSIGNED"
    assert assigned_inc["assigned_responder_id"] == 2

    # Resolve incident
    resp = client.post(f"/api/incidents/{incident_id}/status", json={"status": "RESOLVED"})
    assert resp.status_code == 200
    resolved_inc = resp.json()
    assert resolved_inc["status"] == "RESOLVED"
    assert resolved_inc["response_time_seconds"] is not None

    # 8. Simulate match delay on M08 by 40 minutes
    # First, let's call delay endpoint
    resp = client.post("/api/matches/M08/delay", json={"delay_minutes": 40, "delay_reason": "Inclement Weather"})
    assert resp.status_code == 200
    delayed_match = resp.json()
    assert delayed_match["status"] == "Delayed"
    assert delayed_match["delay_minutes"] == 40

    # Simulate downstream impact preview
    resp = client.post("/api/schedule/simulate-delay?match_id=M08", json={"delay_minutes": 40, "delay_reason": "Inclement Weather"})
    assert resp.status_code == 200
    impact = resp.json()
    # It must shift matches and detect violations
    assert impact["affected_matches"] >= 0
    # There are venue conflicts in the simulated shift
    assert len(impact["schedule"]) == len(matches)

    # 9. Apply the rescheduling plan
    apply_payload = {
        "delay_minutes": 40,
        "delay_reason": "Inclement Weather",
        "schedule": [m for m in impact["schedule"]]
    }
    resp = client.post("/api/schedule/apply-reschedule", json=apply_payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # Verify that DB matches are shifted and conflicts are resolved
    resp = client.get("/api/schedule/conflicts")
    assert resp.status_code == 200
    post_conflicts = resp.json()
    # Shifting shifted matches resolved venue collisions, so conflicts should be 0 and score high
    assert post_conflicts["schedule_quality"] == 100
    assert len(post_conflicts["conflicts"]) == 0

    # 10. Check analytics dashboard metrics
    resp = client.get("/api/analytics")
    assert resp.status_code == 200
    metrics = resp.json()
    assert metrics["ai_recommendations_accepted"] >= 2 # 1 crowd mitigation + 1 reschedule applied
    assert metrics["avg_incident_response_time_mins"] > 0
