from flask import Flask, render_template
from database import create_tables, execute_query,fetch_query

app = Flask(__name__)

app.secret_key = "change_this_later"

create_tables()
@app.route("/")
def home():
    return render_template("index.html")





if __name__ == "__main__":
    app.run(debug=True)


