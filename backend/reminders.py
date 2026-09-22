from datetime import date, timedelta
from database import fetch_query, execute_query
from prediction import compute_raw_prediction, get_fertility_window, get_recent_symptoms, get_user_profile
from email_sender import send_email


def build_period_reminder_body(username, predicted_date_str, symptom_set):
    lines = [
        "Hi,",
        "",
        f"{username} wants to let you know her period is predicted around {predicted_date_str}.",
        "It would be great if her period products were stocked up!",
    ]
    if "cramps" in symptom_set:
        lines.append("She's been experiencing some cramps recently — maybe offer her a hot water bottle.")
    if "badmood" in symptom_set:
        lines.append("She's been feeling a little low lately — a pick-me-up or her favourite treat could go a long way.")
    lines += ["", "Thanks for looking out for her!"]
    return "\n".join(lines)


def build_fertility_reminder_body(username, window_start_str):
    return (
        f"Hi,\n\n"
        f"Just a heads up — {username}'s fertility window is coming up, starting {window_start_str}.\n\n"
        f"Thanks for looking out for her!"
    )


def check_and_send_reminders(user_id):
    user = fetch_query(
        "SELECT Username, ShareEmail, SharingEnabled, LastPeriodReminderCycleStart, LastFertilityReminderWindowStart "
        "FROM User WHERE UserID = ?", (user_id,)
    )
    if not user:
        return
    user = user[0]
    if not user["SharingEnabled"] or not user["ShareEmail"]:
        return

    username = user["Username"]
    email = user["ShareEmail"]
    profile = get_user_profile(user_id)

    if profile == "Fertility":
        window = get_fertility_window(user_id)
        if window:
            window_start = window["start"]
            target_send_date = (date.fromisoformat(window_start) - timedelta(days=1)).isoformat()
            if date.today().isoformat() == target_send_date and user["LastFertilityReminderWindowStart"] != window_start:
                body = build_fertility_reminder_body(username, window_start)
                result = send_email(email, "Cycle Tracker reminder", body)
                if result.get("success"):
                    execute_query(
                        "UPDATE User SET LastFertilityReminderWindowStart = ? WHERE UserID = ?",
                        (window_start, user_id),
                    )
        return  # Fertility profiles get the fertility-window reminder, not a period one

    raw = compute_raw_prediction(user_id)
    if raw is None:
        return  # no predicted period - nothing to remind about

    predicted_date = raw["original_predicted_start"]
    last_period_start = raw["last_period_start"].isoformat()
    target_send_date = predicted_date - timedelta(days=1)

    if date.today() == target_send_date and user["LastPeriodReminderCycleStart"] != last_period_start:
        symptoms = get_recent_symptoms(user_id, days=7)
        body = build_period_reminder_body(username, predicted_date.isoformat(), symptoms)
        result = send_email(email, "Cycle Tracker reminder", body)
        if result.get("success"):
            execute_query(
                "UPDATE User SET LastPeriodReminderCycleStart = ? WHERE UserID = ?",
                (last_period_start, user_id),
            )