from database import fetch_query
from prediction import get_user_profile, PAUSED_PROFILES  # match your actual filename

USER_ID = 1

print("User row:", fetch_query("SELECT * FROM User WHERE UserID = ?", (USER_ID,)))
print("Cycle rows:", fetch_query("SELECT * FROM Cycle WHERE UserID = ?", (USER_ID,)))
print("Symptom rows:", fetch_query("SELECT * FROM Symptom WHERE UserID = ?", (USER_ID,)))

profile = get_user_profile(USER_ID)
print("profile:", repr(profile))
print("is paused:", profile in PAUSED_PROFILES)