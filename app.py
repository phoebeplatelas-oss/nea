from flask import Flask, render_template
from database import create_tables, execute_query,fetch_query

app = Flask(__name__)

app.secret_key = "change_this_later"

create_tables()
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/test")
def test():

    # Add a test user
    execute_query(
        """
        INSERT INTO User (Username, PIN, LifeStage)
        VALUES (?, ?, ?)
        """,
        ("Phoebe", "1234", "Teen")
    )

    # Retrieve users
    users = fetch_query("SELECT * FROM User")

    print("Users in database:")

    for user in users:
        print(dict(user))

    return "Database test complete"

if __name__ == "__main__":
    app.run(debug=True)


