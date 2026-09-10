from database import execute_query
from datetime import date, timedelta

USER_ID = 1
# Clear out any previous test data for this user first, so re-running
# this script is safe and doesn't collide with old partial runs.
execute_query("DELETE FROM Symptom WHERE UserID = ?", (USER_ID,))
execute_query("DELETE FROM Cycle WHERE UserID = ?", (USER_ID,))
execute_query("DELETE FROM User WHERE UserID = ?", (USER_ID,))
# 1. A user with a life stage that isn't paused (must NOT be in PAUSED_PROFILES)
execute_query(
    "INSERT INTO User (UserID, Username, PIN, LifeStage) VALUES (?, ?, ?, ?)",
    (USER_ID, "testuser", "0000", "Menstruating"),
)

# 2. A handful of past cycles, ~28 days apart, oldest first.
#    Adjust column names here if your Cycle table differs.
today = date.today()
cycle_starts = [today - timedelta(days=28 * i) for i in range(4, 0, -1)]  # 4 cycles back

for start in cycle_starts:
    execute_query(
        "INSERT INTO Cycle (UserID, StartDate, PeriodLength) VALUES (?, ?, ?)",
        (USER_ID, start.isoformat(), 5),
    )

# 3. Ovulation symptoms partway through each cycle (~day 14), so
#    get_average_luteal_length has something to find.
for start in cycle_starts:
    ov_date = start + timedelta(days=14)
    execute_query(
        "INSERT INTO Symptom (UserID, Symptom, Date) VALUES (?, ?, ?)",
        (USER_ID, "increased_discharge", ov_date.isoformat()),
    )

print("Seed data inserted for UserID", USER_ID)