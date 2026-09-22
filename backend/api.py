from flask import Flask, jsonify, request
from flask_cors import CORS
from reminders import check_and_send_reminders, build_period_reminder_body, build_fertility_reminder_body
from validation import start_sharing, stop_sharing, get_sharing_status
from email_sender import send_email
from prediction import predict_next_period, predict_period_length, get_fertility_window, predict_period_pill_with_breaks
from database import fetch_query, execute_query
from validation import get_cycle_breakdown, get_logging_streak, get_symptom_timing
from validation import (
    check_pin,
    log_symptoms,
    get_symptom_settings,
    set_symptom_setting,
    get_appointments,
    add_appointment,
)

app = Flask(__name__)
CORS(app)
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    pin = (data.get("pin") or "").strip()
    life_stage = data.get("lifeStage") or "Menstruating"
    age = data.get("age")

    if not username or not pin:
        return jsonify({"success": False, "error": "Username and PIN are required."}), 400

    existing = fetch_query("SELECT UserID FROM User WHERE Username = ?", (username,))
    if existing:
        return jsonify({"success": False, "error": "That username is already taken."}), 409

    execute_query(
        "INSERT INTO User (Username, PIN, LifeStage, Age) VALUES (?, ?, ?, ?)",
        (username, pin, life_stage, age),
    )
    new_user = fetch_query("SELECT UserID FROM User WHERE Username = ?", (username,))[0]
    return jsonify({"success": True, "user_id": new_user["UserID"]})



@app.route("/api/check-username", methods=["POST"])
def check_username():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    if not username:
        return jsonify({"available": False, "error": "Username is required."}), 400

    existing = fetch_query("SELECT UserID FROM User WHERE Username = ?", (username,))
    if existing:
        return jsonify({"available": False, "error": "That username is already taken."})
    return jsonify({"available": True})



@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    pin = (data.get("pin") or "").strip()

    rows = fetch_query("SELECT UserID FROM User WHERE Username = ?", (username,))
    if not rows:
        return jsonify({"success": False, "error": "Incorrect username or PIN."}), 401

    user_id = rows[0]["UserID"]
    ok, message = check_pin(user_id, pin)
    if not ok:
        return jsonify({"success": False, "error": message}), 401

    return jsonify({"success": True, "user_id": user_id})

@app.route("/api/profile", methods=["POST"])
def update_profile():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400

    fields, values = [], []
    if "age" in data:
        fields.append("Age = ?")
        values.append(data.get("age"))
    if "lifeStage" in data:
        fields.append("LifeStage = ?")
        values.append(data.get("lifeStage"))
    if not fields:
        return jsonify({"success": False, "error": "Nothing to update."}), 400

    values.append(user_id)
    execute_query(f"UPDATE User SET {', '.join(fields)} WHERE UserID = ?", tuple(values))
    return jsonify({"success": True})

@app.route("/api/sharing/<int:user_id>")
def get_sharing(user_id):
    return jsonify(get_sharing_status(user_id))


@app.route("/api/sharing/start", methods=["POST"])
def start_sharing_route():
    data = request.get_json()
    user_id = data.get("user_id")
    email = data.get("email")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400
    result = start_sharing(user_id, email)
    return jsonify(result), (200 if result.get("success") else 400)


@app.route("/api/sharing/stop", methods=["POST"])
def stop_sharing_route():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400
    return jsonify(stop_sharing(user_id))


@app.route("/api/sharing/send-reminder", methods=["POST"])
def send_reminder():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400

    status = get_sharing_status(user_id)
    if not status["enabled"] or not status["email"]:
        return jsonify({"success": False, "error": "Sharing is not currently enabled."}), 400

    user = fetch_query("SELECT Username, LifeStage FROM User WHERE UserID = ?", (user_id,))
    username = user[0]["Username"] if user else "Someone"
    profile = user[0]["LifeStage"] if user else None

    if profile == "Fertility":
        window = get_fertility_window(user_id)
        if window:
            body = build_fertility_reminder_body(username, window["start"])
        else:
            body = f"Hi,\n\nNo fertility window is currently predicted for {username}."
    else:
        predicted_date = predict_next_period(user_id)
        if predicted_date:
            symptoms_rows = fetch_query(
                "SELECT DISTINCT Symptom FROM Symptom WHERE UserID = ? AND Date >= date('now', '-7 days')",
                (user_id,),
            )
            symptoms = {r["Symptom"] for r in symptoms_rows}
            body = build_period_reminder_body(username, predicted_date, symptoms)
        else:
            body = f"Hi,\n\nNo period is currently predicted for {username}."

    result = send_email(status["email"], "Cycle Tracker reminder", body)
    return jsonify(result), (200 if result.get("success") else 400)

@app.route("/api/appointments/<int:user_id>")
def get_appointments_route(user_id):
    rows = get_appointments(user_id)
    appointments = [
        {"id": r["AppointmentID"], "title": r["Title"], "date": r["AppointmentDate"], "time": r["Time"], "location": r["Location"]}
        for r in rows
    ]
    return jsonify({"appointments": appointments})


@app.route("/api/appointments", methods=["POST"])
def add_appointment_route():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400
    result = add_appointment(user_id, data.get("title"), data.get("date"), data.get("time"), data.get("location"))
    return jsonify(result), (200 if result.get("success") else 400)


@app.route("/api/symptom-settings/<int:user_id>")
def get_symptom_settings_route(user_id):
    return jsonify({"settings": get_symptom_settings(user_id)})


@app.route("/api/symptom-settings", methods=["POST"])
def set_symptom_settings_route():
    data = request.get_json()
    user_id = data.get("user_id")
    symptom = data.get("symptom")
    if not user_id or not symptom:
        return jsonify({"success": False, "error": "user_id and symptom are required."}), 400
    result = set_symptom_setting(user_id, symptom, bool(data.get("enabled")))
    return jsonify(result)


@app.route("/api/pill-scheduled-breaks/<int:user_id>")
def get_pill_scheduled_breaks(user_id):
    rows = fetch_query("SELECT PillScheduledBreaks FROM User WHERE UserID = ?", (user_id,))
    return jsonify({"enabled": bool(rows[0]["PillScheduledBreaks"]) if rows else False})


@app.route("/api/pill-scheduled-breaks", methods=["POST"])
def set_pill_scheduled_breaks():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400
    execute_query("UPDATE User SET PillScheduledBreaks = ? WHERE UserID = ?", (1 if data.get("enabled") else 0, user_id))
    return jsonify({"success": True})

@app.route("/api/continuous-contraception/<int:user_id>")
def get_continuous_contraception(user_id):
    rows = fetch_query("SELECT ContinuousContraception FROM User WHERE UserID = ?", (user_id,))
    return jsonify({"enabled": bool(rows[0]["ContinuousContraception"]) if rows else False})


@app.route("/api/continuous-contraception", methods=["POST"])
def set_continuous_contraception():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400
    execute_query("UPDATE User SET ContinuousContraception = ? WHERE UserID = ?", (1 if data.get("enabled") else 0, user_id))
    return jsonify({"success": True})

@app.route("/api/continuous-hrt/<int:user_id>")
def get_continuous_hrt(user_id):
    rows = fetch_query("SELECT ContinuousHRT FROM User WHERE UserID = ?", (user_id,))
    return jsonify({"enabled": bool(rows[0]["ContinuousHRT"]) if rows else False})


@app.route("/api/continuous-hrt", methods=["POST"])
def set_continuous_hrt():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required."}), 400
    execute_query("UPDATE User SET ContinuousHRT = ? WHERE UserID = ?", (1 if data.get("enabled") else 0, user_id))
    return jsonify({"success": True})


@app.route("/api/profile/<int:user_id>")
def get_profile(user_id):
    rows = fetch_query("SELECT LifeStage, Age FROM User WHERE UserID = ?", (user_id,))
    if not rows:
        return jsonify({"life_stage": None, "age": None})
    return jsonify({"life_stage": rows[0]["LifeStage"], "age": rows[0]["Age"]})

@app.route("/api/cycle-stats/<int:user_id>")
def cycle_stats(user_id):
    data = get_cycle_breakdown(user_id)
    if data is None:
        return jsonify({"available": False})
    return jsonify({"available": True, **data})


@app.route("/api/symptom-timing/<int:user_id>")
def symptom_timing(user_id):
    return jsonify({"timing": get_symptom_timing(user_id)})

@app.route("/api/fertility-window/<int:user_id>")
def fertility_window(user_id):
    return jsonify(get_fertility_window(user_id) or {})

@app.route("/api/streak/<int:user_id>")
def get_streak(user_id):
    return jsonify({"streak": get_logging_streak(user_id)})

@app.route("/api/prediction/<int:user_id>")
def get_prediction(user_id):
    try:
        check_and_send_reminders(user_id)
    except Exception as e:
        print("Reminder check failed:", e)

    rows = fetch_query("SELECT PillScheduledBreaks FROM User WHERE UserID = ?", (user_id,))
    pill_with_breaks = bool(rows[0]["PillScheduledBreaks"]) if rows else False

    if pill_with_breaks:
        predicted_date, length = predict_period_pill_with_breaks(user_id)
    else:
        predicted_date = predict_next_period(user_id)
        length = predict_period_length(user_id) if predicted_date else None

    if predicted_date is None:
        return jsonify({"predicted_date": None, "reason": "not enough history or predictions paused", "length": None})
    return jsonify({"predicted_date": predicted_date, "length": length or 5})

@app.route("/api/symptoms/<int:user_id>")
def list_symptoms(user_id):
    start = request.args.get("start")
    end = request.args.get("end")
    if not start or not end:
        return jsonify({"success": False, "error": "start and end query params are required."}), 400

    rows = fetch_query(
        "SELECT Date, Symptom FROM Symptom WHERE UserID = ? AND Date BETWEEN ? AND ? ORDER BY Date",
        (user_id, start, end),
    )
    return jsonify({"symptoms": [{"date": r["Date"], "symptom": r["Symptom"]} for r in rows]})

@app.route("/api/log-symptoms", methods=["POST"])
def api_log_symptoms():
    data = request.get_json()
    user_id = data.get("user_id")
    date_str = data.get("date")
    symptoms = data.get("symptoms", [])

    if not user_id or not date_str:
        return jsonify({"success": False, "error": "user_id and date are required."}), 400

    result = log_symptoms(user_id, date_str, symptoms)
    if result["action"] == "rejected":
        return jsonify({"success": False, "error": result["message"]}), 400

    return jsonify({"success": True, **result})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
