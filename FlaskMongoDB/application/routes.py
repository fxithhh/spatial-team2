from application import app
from flask import render_template

@app.route("/")

def function():
    return render_template("layout.html")

