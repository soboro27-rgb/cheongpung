from flask import Flask, render_template, jsonify
import db

app = Flask(__name__)
db.init_db()


@app.route("/")
def index():
    trades  = [dict(r) for r in db.get_all_trades(200)]
    summary = db.get_summary()
    return render_template("index.html", trades=trades, summary=summary)


@app.route("/api/summary")
def api_summary():
    return jsonify(db.get_summary())


@app.route("/api/trades")
def api_trades():
    return jsonify([dict(r) for r in db.get_all_trades(200)])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)
