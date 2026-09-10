from flask import Flask, jsonify, request
from flask_cors import CORS
from database import fetch_query, execute_query
from prediction import predict_next_period
from validation import check_pin
from validation import log_symptoms

app = Flask(__name__)
CORS(app)
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    pin = (data.get("pin") or "").strip()
    life_stage = data.get("lifeStage") or "Menstruating"

    if not username or not pin:
        return jsonify({"success": False, "error": "Username and PIN are required."}), 400

    existing = fetch_query("SELECT UserID FROM User WHERE Username = ?", (username,))
    if existing:
        return jsonify({"success": False, "error": "That username is already taken."}), 409

    execute_query(
        "INSERT INTO User (Username, PIN, LifeStage) VALUES (?, ?, ?)",
        (username, pin, life_stage),
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
