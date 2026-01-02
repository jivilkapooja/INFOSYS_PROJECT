import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-container">
      <div className="lp-card">
        <h1>Loan Eligibility Advisory Portal</h1>

        <p className="lp-subtitle">
          AI-Driven Credit Evaluation & Risk Assessment
        </p>

        <p className="lp-description">
          This platform assists users in evaluating loan eligibility using
          machine learning models. The system analyzes financial details,
          provides approval likelihood, explains decisions using Explainable AI,
          and generates a downloadable eligibility report.
        </p>

        

        <button className="lp-btn" onClick={() => navigate("/login")}>
          Proceed to Login
        </button>
      </div>
    </div>
  );
}
