from typing import List, Tuple, Dict, Any, Optional
from .models import ResponseTeam, Incident

# Distance matrix representing ETA in minutes between stadium locations
LOCATION_ETA = {
    "North Stand": {
        "North Stand": 1.0, "South Stand": 4.0, "East Stand": 2.0, "West Stand": 2.0,
        "Food Court": 2.5, "Entry Gate A": 2.0, "Entry Gate B": 3.0, "Entry Gate C": 3.0, "Parking Area": 4.5
    },
    "South Stand": {
        "North Stand": 4.0, "South Stand": 1.0, "East Stand": 2.0, "West Stand": 2.0,
        "Food Court": 2.5, "Entry Gate A": 3.0, "Entry Gate B": 2.0, "Entry Gate C": 2.0, "Parking Area": 3.5
    },
    "East Stand": {
        "North Stand": 2.0, "South Stand": 2.0, "East Stand": 1.0, "West Stand": 4.0,
        "Food Court": 2.0, "Entry Gate A": 3.0, "Entry Gate B": 2.0, "Entry Gate C": 3.0, "Parking Area": 4.0
    },
    "West Stand": {
        "North Stand": 2.0, "South Stand": 2.0, "East Stand": 4.0, "West Stand": 1.0,
        "Food Court": 2.0, "Entry Gate A": 2.0, "Entry Gate B": 3.0, "Entry Gate C": 2.0, "Parking Area": 4.0
    },
    "Food Court": {
        "North Stand": 2.5, "South Stand": 2.5, "East Stand": 2.0, "West Stand": 2.0,
        "Food Court": 1.0, "Entry Gate A": 2.0, "Entry Gate B": 2.0, "Entry Gate C": 2.0, "Parking Area": 3.0
    },
    "Entry Gate A": {
        "North Stand": 2.0, "South Stand": 3.0, "East Stand": 3.0, "West Stand": 2.0,
        "Food Court": 2.0, "Entry Gate A": 1.0, "Entry Gate B": 3.0, "Entry Gate C": 4.0, "Parking Area": 2.5
    },
    "Entry Gate B": {
        "North Stand": 3.0, "South Stand": 2.0, "East Stand": 2.0, "West Stand": 3.0,
        "Food Court": 2.0, "Entry Gate A": 3.0, "Entry Gate B": 1.0, "Entry Gate C": 3.0, "Parking Area": 3.0
    },
    "Entry Gate C": {
        "North Stand": 3.0, "South Stand": 2.0, "East Stand": 3.0, "West Stand": 2.0,
        "Food Court": 2.0, "Entry Gate A": 4.0, "Entry Gate B": 3.0, "Entry Gate C": 1.0, "Parking Area": 2.5
    },
    "Parking Area": {
        "North Stand": 4.5, "South Stand": 3.5, "East Stand": 4.0, "West Stand": 4.0,
        "Food Court": 3.0, "Entry Gate A": 2.5, "Entry Gate B": 3.0, "Entry Gate C": 2.5, "Parking Area": 1.0
    }
}

def get_eta(loc_a: str, loc_b: str) -> float:
    # Normalize keys by stripping and title-casing
    a = loc_a.strip().title()
    b = loc_b.strip().title()
    
    # Try mapping variations
    if "Gate A" in a: a = "Entry Gate A"
    if "Gate B" in a: a = "Entry Gate B"
    if "Gate C" in a: a = "Entry Gate C"
    if "Gate A" in b: b = "Entry Gate A"
    if "Gate B" in b: b = "Entry Gate B"
    if "Gate C" in b: b = "Entry Gate C"
    
    if "Parking" in a: a = "Parking Area"
    if "Parking" in b: b = "Parking Area"
    
    # Return mapping or fallback to 3 mins
    return LOCATION_ETA.get(a, {}).get(b, 3.0)

def find_best_responder(incident_type: str, incident_location: str, responders: List[ResponseTeam]) -> Tuple[Optional[ResponseTeam], float, str]:
    # Determine specialty required
    # types: Medical, Security, Crowd, Equipment, Infrastructure, Lost Person
    # responders: Medical (Medical Alpha, Bravo), Security (Security Team 1, 2), Technical (Technical Operations)
    
    preferred_type = "Security"
    if incident_type.lower() == "medical":
        preferred_type = "Medical"
    elif incident_type.lower() in ("equipment", "infrastructure"):
        preferred_type = "Technical"
    elif incident_type.lower() in ("crowd", "security", "lost person"):
        preferred_type = "Security"

    # Filter responders that are online & available first
    available_responders = [r for r in responders if r.status == "Available"]
    
    # Fallback to busy responders if none available
    if not available_responders:
        available_responders = [r for r in responders if r.status != "Offline"]
        
    if not available_responders:
        return None, 999.0, "No responders online."

    # Filter by specialty first
    specialist_responders = [r for r in available_responders if r.type.lower() == preferred_type.lower()]
    
    # If no specialists available, use any available responder
    candidate_list = specialist_responders if specialist_responders else available_responders
    
    best_responder = None
    best_eta = 999.0
    
    for r in candidate_list:
        eta = get_eta(r.location, incident_location)
        # Give available responders priority over busy ones
        if r.status == "Busy":
            eta += 5.0 # Add penalty for being busy
            
        if eta < best_eta:
            best_eta = eta
            best_responder = r
            
    if not best_responder:
        return None, 999.0, "No suitable responder found."
        
    # Build explanation reason
    specialty_match = "matching specialty" if best_responder.type.lower() == preferred_type.lower() else "cross-functional support"
    status_note = "" if best_responder.status == "Available" else " (currently busy, dispatched as secondary)"
    reason = f"Nearest available {best_responder.type} unit with {specialty_match} at {best_responder.location}{status_note}."
    
    return best_responder, best_eta, reason
