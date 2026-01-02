from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import joblib
import numpy as np
import os
import io
from fpdf import FPDF
import mysql.connector
import shap
import matplotlib
matplotlib.use("Agg")


import matplotlib.pyplot as plt



app = Flask(__name__)
CORS(app)

# ---------------- MYSQL DATABASE ----------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="user_auth"
)
cursor = db.cursor(dictionary=True)

# ---------------- LOAD MODEL ----------------
MODEL_PATH = "xgboost_loan_model.pkl"
model = joblib.load("xgboost_loan_model.pkl")
model_accuracy = joblib.load("model_accuracy.pkl")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("❌ xgboost_loan_model.pkl not found")

model = joblib.load(MODEL_PATH)


explainer = shap.TreeExplainer(model)

# ---------------- HEALTH CHECK ----------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Backend running"}), 200
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    username = data.get("username")
    password = data.get("password")

    # TEMP SIMPLE LOGIN (for project/demo)
    if username and password:
        return jsonify({
            "token": "dummy-jwt-token",
            "msg": "Login successful"
        }), 200
    else:
        return jsonify({"msg": "Invalid credentials"}), 401



# ---------------- LOAN PREDICTION ----------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    X = np.array([[ 
        int(data["Gender"]),
        int(data["Married"]),
        int(data["Dependents"]),
        int(data["Education"]),
        int(data["Self_Employed"]),
        float(data["ApplicantIncome"]),
        float(data["CoapplicantIncome"]),
        float(data["LoanAmount"]),
        float(data["Loan_Amount_Term"]),
        int(data["Credit_History"]),
        int(data["Property_Area"])
    ]])

    prob = float(model.predict_proba(X)[0][1])
    decision = "Approved" if prob >= 0.5 else "Rejected"

    # -------- REASON --------
    if decision == "Approved":
        reason = "Good credit history and sufficient income"
    else:
        reason = "Low income or weak credit history"

    # -------- EMI --------
    loan = float(data["LoanAmount"])
    tenure = float(data["Loan_Amount_Term"])
    annual_rate = 0.1275 if decision == "Approved" else 0.162
    monthly_rate = annual_rate / 12

    emi = (loan * monthly_rate * (1 + monthly_rate) ** tenure) / \
          ((1 + monthly_rate) ** tenure - 1)

    # -------- INSERT INTO MYSQL (FIXED) --------
    sql = """
        INSERT INTO loan_applications (loan_amount, status, reason)
        VALUES (%s, %s, %s)
    """
    values = (
        loan,
        decision,
        reason
    )

    cursor.execute(sql, values)
    db.commit()

    application_id = cursor.lastrowid

    return jsonify({
        "loan_id": f"LN-{application_id}",
        "decision": decision,
        "accuracy": round(model_accuracy * 100, 2),
        "confidence": round(prob * 100, 2),  # UI only
        "loan_amount": loan,
        "reason": reason,
        "chart": {
            "income": float(data["ApplicantIncome"]) + float(data["CoapplicantIncome"]),
            "loan": loan,
            "emi": round(emi, 2)
        }
    })

# ---------------- APPLICATIONS TABLE API ----------------
@app.route("/applications", methods=["GET"])
def applications():
    cursor.execute("""
        SELECT loan_id, loan_amount, status, reason
        FROM loan_applications
        ORDER BY loan_id DESC
    """)
    rows = cursor.fetchall()

    return jsonify([
        {
            "loan_id": f"LN-{row['loan_id']}",
            "loan_amount": row["loan_amount"],
            "status": row["status"],
            "reason": row["reason"]
        }
        for row in rows
    ])

# ---------------- PDF ----------------
@app.route("/generate-pdf", methods=["POST"])
def generate_pdf():
    data = request.json

    # Use 'Rs.' instead of '₹' to avoid Latin-1 encoding errors
    applicant_details = {
        "Gender": "Male" if int(data["Gender"]) == 1 else "Female",
        "Marital Status": "Married" if int(data["Married"]) == 1 else "Unmarried",
        "Dependents": data["Dependents"],
        "Education": "Graduate" if int(data["Education"]) == 1 else "Not Graduate",
        "Employment Type": "Self Employed" if int(data["Self_Employed"]) == 1 else "Not Self Employed",
    }

    financial_details = {
        "Applicant Income": f"Rs. {float(data['ApplicantIncome']):,.0f}",
        "Co-Applicant Income": f"Rs. {float(data['CoapplicantIncome']):,.0f}",
        "Loan Amount": f"Rs. {float(data['LoanAmount']):,.0f}",
        "Loan Term": f"{int(data['Loan_Amount_Term'])} Months",
        "Credit History": "Good" if int(data["Credit_History"]) == 1 else "Poor",
        "Property Area": ["Rural", "Semiurban", "Urban"][int(data["Property_Area"])]
    }

    decision = data["decision"]
    confidence = data["confidence"]

    # SHAP Calculation
    X = np.array([[ 
        int(data["Gender"]), int(data["Married"]), int(data["Dependents"]),
        int(data["Education"]), int(data["Self_Employed"]), float(data["ApplicantIncome"]),
        float(data["CoapplicantIncome"]), float(data["LoanAmount"]),
        float(data["Loan_Amount_Term"]), int(data["Credit_History"]), int(data["Property_Area"])
    ]])

    shap_values = explainer(X)
    feature_names = [
        "Gender", "Married", "Dependents", "Education", "Self Employed",
        "Applicant Income", "Coapplicant Income", "Loan Amount",
        "Loan Term", "Credit History", "Property Area"
    ]

    plt.figure(figsize=(8, 5))
    shap.bar_plot(shap_values.values[0], feature_names=feature_names, show=False)
    shap_img = "shap_plot.png"
    plt.savefig(shap_img, bbox_inches="tight")
    plt.close()

    # Create PDF using fpdf2
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "Loan Eligibility Prediction Report", ln=True, align="C")
    pdf.ln(6)

    pdf.set_font("helvetica", "B", 12)
    pdf.cell(60, 8, "Decision Status", border=1)
    pdf.cell(0, 8, decision, border=1, ln=True)
    pdf.cell(60, 8, "Confidence Score", border=1)
    pdf.cell(0, 8, f"{confidence} %", border=1, ln=True)
    pdf.ln(8)

    def draw_table(title, data_dict):
        pdf.set_font("helvetica", "B", 13)
        pdf.cell(0, 8, title, ln=True)
        pdf.ln(2)
        pdf.set_font("helvetica", "B", 11)
        pdf.cell(80, 8, "Field", border=1)
        pdf.cell(0, 8, "Value", border=1, ln=True)
        pdf.set_font("helvetica", "", 11)
        for k, v in data_dict.items():
            pdf.cell(80, 8, k, border=1)
            pdf.cell(0, 8, str(v), border=1, ln=True)
        pdf.ln(6)

    draw_table("Applicant Details", applicant_details)
    draw_table("Financial Details", financial_details)

    pdf.set_font("helvetica", "B", 13)
    pdf.cell(0, 8, "Model Explainability (SHAP)", ln=True)
    pdf.ln(2)
    pdf.image(shap_img, x=40, w=130)

    # fpdf2: output() returns bytes directly
    pdf_bytes = pdf.output()
    
    if os.path.exists(shap_img):
        os.remove(shap_img)

    return send_file(
        io.BytesIO(pdf_bytes),
        as_attachment=True,
        download_name="Loan_Report.pdf",
        mimetype="application/pdf"
    )


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
