from flask import Flask, jsonify, request
from flask_cors import CORS
from database import fetch_query, execute_query
from prediction import predict_next_period, predict_period_length, get_fertility_window
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


@app.route("/api/period-forecast/<int:user_id>")
def period_forecast(user_id):
    predicted_date = predict_next_period(user_id)
    if predicted_date is None:
        return jsonify({"start": None, "length": None})
    return jsonify({"start": predicted_date, "length": predict_period_length(user_id) or 5})


@app.route("/api/fertility-window/<int:user_id>")
def fertility_window(user_id):
    return jsonify(get_fertility_window(user_id) or {})

@app.route("/api/prediction/<int:user_id>")
def get_prediction(user_id):
    predicted_date = predict_next_period(user_id)
    if predicted_date is None:
        return jsonify({"predicted_date": None, "reason": "not enough history or predictions paused"})
    return jsonify({"predicted_date": predicted_date})


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
