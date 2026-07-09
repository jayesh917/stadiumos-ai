from typing import List, Dict, Any

def calculate_risk_score(occupancy_ratio: float, entry_rate: float, queue_length: int, congestion_trend: float) -> float:
    # Normalize inputs
    # max expected entry rate = 100 pax/min
    # max expected queue length = 200 people
    normalized_entry = min(1.0, entry_rate / 100.0)
    normalized_queue = min(1.0, queue_length / 200.0)
    
    # trend is -1.0 to 1.0 (flow change index)
    # Map trend from [-1.0, 1.0] to [0.0, 1.0]
    normalized_trend = (congestion_trend + 1.0) / 2.0
    normalized_trend = min(1.0, max(0.0, normalized_trend))
    
    score = (0.40 * occupancy_ratio + 0.25 * normalized_entry + 0.20 * normalized_queue + 0.15 * normalized_trend) * 100
    return round(max(0.0, min(100.0, score)), 1)

def get_risk_status(risk_score: float) -> str:
    if risk_score < 50.0:
        return "NORMAL"
    elif risk_score < 70.0:
        return "WATCH"
    elif risk_score < 85.0:
        return "HIGH"
    else:
        return "CRITICAL"

def get_scenario_data(scenario: str) -> Dict[str, Dict[str, Any]]:
    # Deterministic modifications for crowd zones based on scenario
    # Default zones are: north_stand, south_stand, east_stand, west_stand, food_court, gate_a, gate_b, gate_c, parking
    
    scenarios = {
        "NORMAL": {
            "north_stand": {"occ": 12000, "entry": 10, "exit": 5, "queue": 10, "trend": 0.0},
            "south_stand": {"occ": 10000, "entry": 8, "exit": 4, "queue": 5, "trend": 0.0},
            "east_stand": {"occ": 8000, "entry": 12, "exit": 6, "queue": 8, "trend": 0.0},
            "west_stand": {"occ": 9000, "entry": 15, "exit": 8, "queue": 12, "trend": 0.0},
            "food_court": {"occ": 1200, "entry": 25, "exit": 20, "queue": 25, "trend": 0.1},
            "gate_a": {"occ": 100, "entry": 30, "exit": 0, "queue": 20, "trend": 0.0},
            "gate_b": {"occ": 120, "entry": 25, "exit": 0, "queue": 15, "trend": 0.0},
            "gate_c": {"occ": 80, "entry": 20, "exit": 0, "queue": 10, "trend": 0.0},
            "parking": {"occ": 2200, "entry": 15, "exit": 5, "queue": 5, "trend": 0.0}
        },
        "MATCH_ENDED": {
            "north_stand": {"occ": 2000, "entry": 0, "exit": 120, "queue": 0, "trend": -0.8},
            "south_stand": {"occ": 1500, "entry": 0, "exit": 110, "queue": 0, "trend": -0.8},
            "east_stand": {"occ": 1000, "entry": 0, "exit": 95, "queue": 0, "trend": -0.7},
            "west_stand": {"occ": 1200, "entry": 0, "exit": 105, "queue": 0, "trend": -0.7},
            "food_court": {"occ": 400, "entry": 5, "exit": 40, "queue": 5, "trend": -0.4},
            "gate_a": {"occ": 450, "entry": 0, "exit": 120, "queue": 80, "trend": 0.6},
            "gate_b": {"occ": 500, "entry": 0, "exit": 130, "queue": 95, "trend": 0.7},
            "gate_c": {"occ": 420, "entry": 0, "exit": 110, "queue": 70, "trend": 0.5},
            "parking": {"occ": 2800, "entry": 120, "exit": 110, "queue": 150, "trend": 0.8}
        },
        "ENTRY_SURGE": {
            "north_stand": {"occ": 8000, "entry": 80, "exit": 5, "queue": 10, "trend": 0.6},
            "south_stand": {"occ": 7000, "entry": 75, "exit": 4, "queue": 5, "trend": 0.5},
            "east_stand": {"occ": 5500, "entry": 60, "exit": 3, "queue": 5, "trend": 0.5},
            "west_stand": {"occ": 6000, "entry": 65, "exit": 3, "queue": 5, "trend": 0.5},
            "food_court": {"occ": 800, "entry": 15, "exit": 15, "queue": 10, "trend": 0.1},
            "gate_a": {"occ": 350, "entry": 95, "exit": 0, "queue": 140, "trend": 0.8},
            "gate_b": {"occ": 380, "entry": 98, "exit": 0, "queue": 160, "trend": 0.9},
            "gate_c": {"occ": 280, "entry": 75, "exit": 0, "queue": 110, "trend": 0.7},
            "parking": {"occ": 3200, "entry": 90, "exit": 10, "queue": 80, "trend": 0.5}
        },
        "FOOD_COURT_SURGE": {
            "north_stand": {"occ": 14000, "entry": 15, "exit": 25, "queue": 0, "trend": -0.1},
            "south_stand": {"occ": 12000, "entry": 10, "exit": 20, "queue": 0, "trend": -0.1},
            "east_stand": {"occ": 9500, "entry": 10, "exit": 15, "queue": 0, "trend": -0.1},
            "west_stand": {"occ": 11000, "entry": 12, "exit": 18, "queue": 0, "trend": -0.1},
            "food_court": {"occ": 2800, "entry": 95, "exit": 40, "queue": 180, "trend": 0.9},
            "gate_a": {"occ": 120, "entry": 15, "exit": 0, "queue": 10, "trend": 0.0},
            "gate_b": {"occ": 110, "entry": 12, "exit": 0, "queue": 8, "trend": 0.0},
            "gate_c": {"occ": 90, "entry": 10, "exit": 0, "queue": 5, "trend": 0.0},
            "parking": {"occ": 3400, "entry": 15, "exit": 8, "queue": 12, "trend": 0.1}
        },
        "CRITICAL_CONGESTION": {
            "north_stand": {"occ": 18500, "entry": 15, "exit": 5, "queue": 0, "trend": 0.1},
            "south_stand": {"occ": 16500, "entry": 12, "exit": 4, "queue": 0, "trend": 0.1},
            "east_stand": {"occ": 14000, "entry": 18, "exit": 6, "queue": 0, "trend": 0.2},
            "west_stand": {"occ": 14500, "entry": 15, "exit": 5, "queue": 0, "trend": 0.1},
            "food_court": {"occ": 1500, "entry": 30, "exit": 25, "queue": 35, "trend": 0.2},
            "gate_a": {"occ": 220, "entry": 40, "exit": 0, "queue": 45, "trend": 0.2},
            "gate_b": {"occ": 485, "entry": 95, "exit": 0, "queue": 185, "trend": 0.95}, # Critical Gate B
            "gate_c": {"occ": 180, "entry": 25, "exit": 0, "queue": 25, "trend": 0.1},
            "parking": {"occ": 3800, "entry": 25, "exit": 12, "queue": 20, "trend": 0.2}
        }
    }
    
    return scenarios.get(scenario, scenarios["NORMAL"])
