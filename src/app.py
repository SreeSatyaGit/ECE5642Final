import pyvo
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

def fetch_toi_data():
    
    tap_service = pyvo.dal.TAPService("https://exoplanetarchive.ipac.caltech.edu/TAP")
    query = ("SELECT *FROM toi")
    try:
        result = tap_service.search(query)
        astro_table = result.to_table()
        df = astro_table.to_pandas()
        print("Fetched TOI data. Columns:", df.columns.tolist())
        return df
    except Exception as err:
        print("Error fetching TOI data:", err)
        return None

@app.route("/test")
def test():
    return "Test endpoint working!"

@app.route("/api/toi_visualization_data")
def toi_visualization_data():
    df = fetch_toi_data()
    if df is None:
        return jsonify({"error": "Could not fetch TOI data"}), 500

    # For transit duration, check if one of the expected columns exists.
    if "pl_trandur" in df.columns:
        duration_col = "pl_trandur"
    elif "pl_trandurh" in df.columns:
        duration_col = "pl_trandurh"
    else:
        duration_col = None
        print("Warning: Transit Duration column not found; it will return an empty array.")


    data = {}
    data["pl_orbper"] = df["pl_orbper"].dropna().tolist() if "pl_orbper" in df.columns else []
    data["pl_tranmid"] = df["pl_tranmid"].dropna().tolist() if "pl_tranmid" in df.columns else []
    data["pl_trandep"] = df["pl_trandep"].dropna().tolist() if "pl_trandep" in df.columns else []
    if duration_col is not None:
        data["pl_trandur"] = df[duration_col].dropna().tolist()
    else:
        data["pl_trandur"] = []

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
