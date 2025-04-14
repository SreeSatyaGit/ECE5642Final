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


    data = {}
    data["toidisplay"] = df["toidisplay"].dropna().tolist() if "toidisplay" in df.columns else []
    data["pl_rade"] = df["pl_rade"].dropna().tolist() if "pl_rade" in df.columns else []
    data["pl_trandurh"] = df["pl_trandurh"].dropna().tolist() if "pl_trandurh" in df.columns else []
    data["pl_eqt"] = df["pl_eqt"].dropna().tolist() if "pl_eqt" in df.columns else []
    data["st_dist"] = df["st_dist"].dropna().tolist() if "st_dist" in df.columns else []
    data["toi_created"] = df["toi_created"].dropna().tolist() if "toi_created" in df.columns else []
    data["pl_tranmid"] = df["pl_tranmid"].dropna().tolist() if "pl_tranmid" in df.columns else []


    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
