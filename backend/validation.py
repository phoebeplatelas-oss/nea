from datetime import datetime, timedelta, date
from database import fetch_query, execute_query
from prediction import PAUSED_PROFILES


def validate_pin(pin):
    if not pin.isdigit() or len(pin) != 4:
        return False, "PIN must be exactly 4 digits."
    return True, ""


def validate_date_not_future(date_str):
    try:
        entered = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return False, "Date format must be YYYY-MM-DD."
    if entered > date.today():
        return False, "Date cannot be in the future."
    return True, ""

def validate_period_length(length):
    try:
        length = int(length)
    except (TypeError, ValueError):
        return False, "Period length must be a number."
    if length < 1:
        return False, "Period length must be at least 1 day."
    return True, ""




def days_since_nearest_period(user_id, date_str):
    # returns how many days date_str is from the nearest existing period
    # (0 if it falls inside one), or None if the user has no cycles yet
    new_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    cycles = fetch_query("SELECT * FROM Cycle WHERE UserID = ?", (user_id,))
    if not cycles:
        return None

    closest_gap = None
    for cycle in cycles:
        start = datetime.strptime(cycle["StartDate"], "%Y-%m-%d").date()
        end = start + timedelta(days=cycle["PeriodLength"] - 1)
        if start <= new_date <= end:
            gap = 0
        elif new_date > end:
            gap = (new_date - end).days
        else:
            gap = (start - new_date).days
        if closest_gap is None or gap < closest_gap:
            closest_gap = gap
    return closest_gap


def get_bleeding_run(user_id, date_str):
    # finds the contiguous run of days (including date_str) where any
    # bleeding symptom was logged - used so a single isolated bleeding day
    # isn't immediately treated as a new period, only a confirmed run of 2+
    target = datetime.strptime(date_str, "%Y-%m-%d").date()
    placeholders = ",".join("?" for _ in BLEEDING_SYMPTOMS)
    rows = fetch_query(
        f"SELECT DISTINCT Date FROM Symptom WHERE UserID = ? AND Symptom IN ({placeholders})",
        (user_id, *BLEEDING_SYMPTOMS),
    )
    bleeding_dates = {datetime.strptime(r["Date"], "%Y-%m-%d").date() for r in rows}
    bleeding_dates.add(target)

    start = target
    while (start - timedelta(days=1)) in bleeding_dates:
        start -= timedelta(days=1)
    end = target
    while (end + timedelta(days=1)) in bleeding_dates:
        end += timedelta(days=1)

    length = (end - start).days + 1
    return start, length


def check_and_merge_cycle(user_id, start_date_str, period_length):
    new_start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    new_end = new_start + timedelta(days=period_length - 1)
 
    existing_cycles = fetch_query(
        "SELECT * FROM Cycle WHERE UserID = ?", (user_id,)
    )
 
    for cycle in existing_cycles:
        existing_start = datetime.strptime(cycle["StartDate"], "%Y-%m-%d").date()
        existing_end = existing_start + timedelta(days=cycle["PeriodLength"] - 1)
 
        if new_start > existing_end:
            gap = (new_start - existing_end).days - 1
        elif existing_start > new_end:
            gap = (existing_start - new_end).days - 1
        else:
            gap = -1
 
        if gap <= 3:
            merged_start = min(existing_start, new_start)
            merged_end = max(existing_end, new_end)
            merged_length = (merged_end - merged_start).days + 1
 
            execute_query(
                "UPDATE Cycle SET StartDate = ?, PeriodLength = ? WHERE CycleID = ?",
                (merged_start.isoformat(), merged_length, cycle["CycleID"]),
            )
            return {
                "action": "merged",
                "message": f"Merged with existing period starting {merged_start}.",
            }
 
    execute_query(
        "INSERT INTO Cycle (StartDate, UserID, PeriodLength) VALUES (?, ?, ?)",
        (start_date_str, user_id, period_length),
    )
    return {"action": "inserted", "message": "New period recorded."}

def sync_cycle_after_removal(user_id, removed_date_str):
    # Called when a bleeding entry is cleared for a date that was already
    # part of a saved Cycle. Recomputes that cycle from whatever bleeding
    # days are still actually logged in its old date range — shrinking it,
    # or deleting it entirely if nothing's left.
    removed_date = datetime.strptime(removed_date_str, "%Y-%m-%d").date()
    cycles = fetch_query("SELECT * FROM Cycle WHERE UserID = ?", (user_id,))

    for cycle in cycles:
        start = datetime.strptime(cycle["StartDate"], "%Y-%m-%d").date()
        end = start + timedelta(days=cycle["PeriodLength"] - 1)
        if not (start <= removed_date <= end):
            continue  # this cycle isn't the one affected

        placeholders = ",".join("?" for _ in BLEEDING_SYMPTOMS)
        rows = fetch_query(
            f"SELECT DISTINCT Date FROM Symptom WHERE UserID = ? AND Symptom IN ({placeholders}) "
            f"AND Date BETWEEN ? AND ?",
            (user_id, *BLEEDING_SYMPTOMS, start.isoformat(), end.isoformat()),
        )
        remaining = sorted(datetime.strptime(r["Date"], "%Y-%m-%d").date() for r in rows)

        if not remaining:
            execute_query("DELETE FROM Cycle WHERE CycleID = ?", (cycle["CycleID"],))
            return {"action": "deleted", "message": f"Removed period that started {start}."}

        new_start = remaining[0]
        new_length = (remaining[-1] - new_start).days + 1
        execute_query(
            "UPDATE Cycle SET StartDate = ?, PeriodLength = ? WHERE CycleID = ?",
            (new_start.isoformat(), new_length, cycle["CycleID"]),
        )
        return {"action": "shrunk", "message": f"Period updated to start {new_start}, now {new_length} day(s)."}

    return None  # the removed date wasn't part of any saved cycle anyway

ALLOWED_SYMPTOMS = {
    "cramps", "bloating", "breast_soreness", "increased_discharge","increased_libido", "badmood", "badskin", "diarrhea", "bleedinglight", "bleedingheavy", "lowenergy"
}

BLEEDING_SYMPTOMS = {"bleedinglight", "bleedingheavy"}

def log_symptoms(user_id, date_str, symptoms_list):
    valid, msg = validate_date_not_future(date_str)
    if not valid:
        return {"action": "rejected", "message": msg}
 
    unknown = [s for s in symptoms_list if s not in ALLOWED_SYMPTOMS]
    if unknown:
        return {"action": "rejected", "message": f"Unrecognised symptom(s): {', '.join(unknown)}"}
 
    existing = fetch_query(
        "SELECT * FROM Symptom WHERE UserID = ? AND Date = ?", (user_id, date_str)
    )
    action = "updated" if existing else "logged"
    existing_symptoms = {row["Symptom"] for row in existing}
 
    execute_query("DELETE FROM Symptom WHERE UserID = ? AND Date = ?", (user_id, date_str))
    for symptom in symptoms_list:
        execute_query(
            "INSERT INTO Symptom (UserID, Date, Symptom) VALUES (?, ?, ?)",
            (user_id, date_str, symptom),
        )

        cycle_result = None
    symptom_set = set(symptoms_list)
    had_bleeding = bool(existing_symptoms & BLEEDING_SYMPTOMS)
    has_bleeding = bool(BLEEDING_SYMPTOMS & symptom_set)

    if has_bleeding:
        user = fetch_query("SELECT LifeStage FROM User WHERE UserID = ?", (user_id,))
        profile = user[0]["LifeStage"] if user else None
        if profile not in PAUSED_PROFILES:
            run_start, run_length = get_bleeding_run(user_id, date_str)
            gap = days_since_nearest_period(user_id, date_str)
            near_existing_period = gap is not None and gap <= 3

            if run_length >= 2:
                cycle_result = check_and_merge_cycle(user_id, run_start.isoformat(), run_length)
            elif near_existing_period:
                cycle_result = check_and_merge_cycle(user_id, date_str, 1)
    elif had_bleeding:
        # bleeding was logged on this date before, and just got cleared —
        # sync (shrink/delete) whichever Cycle row that day belonged to
        user = fetch_query("SELECT LifeStage FROM User WHERE UserID = ?", (user_id,))
        profile = user[0]["LifeStage"] if user else None
        if profile not in PAUSED_PROFILES:
            cycle_result = sync_cycle_after_removal(user_id, date_str)

    return {
        "action": action,
        "message": f"Symptom log for {date_str} {action}.",
        "cycle_update": cycle_result,
    }


def validate_medication_name(name):
    if not name or not name.strip():
        return False, "Medication name cannot be blank."
    return True, ""


def validate_medication_time(reminder_time):
    if not reminder_time:
        return False, "Reminder time is required."
    return True, ""


def validate_appointment(title, date_str, time_str):
    if not title or not title.strip():
        return False, "Appointment title cannot be blank."

    if not date_str or not time_str:
        return False, "Appointment date and time are required."

    appt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    if appt_date < date.today():
        return False, "Appointment date cannot be in the past."

    return True, ""


def check_pin(user_id, entered_pin):
    user = fetch_query("SELECT * FROM User WHERE UserID = ?", (user_id,))
    if not user:
        return False, "User not found."
    user = user[0]

    # check the PIN itself first - a correct PIN should recover a locked
    # account, per SC9: "access denied until correct PIN entered"
    if entered_pin == user["PIN"]:
        execute_query("UPDATE User SET FailedAttempts = 0 WHERE UserID = ?", (user_id,))
        return True, "PIN correct."

    if user["FailedAttempts"] >= 3:
        return False, "Account locked. Enter the correct PIN to unlock."

    execute_query(
        "UPDATE User SET FailedAttempts = FailedAttempts + 1 WHERE UserID = ?", (user_id,)
    )
    remaining = 3 - (user["FailedAttempts"] + 1)
    if remaining <= 0:
        return False, "Incorrect PIN. Account now locked."
    return False, f"Incorrect PIN. {remaining} attempt(s) remaining."