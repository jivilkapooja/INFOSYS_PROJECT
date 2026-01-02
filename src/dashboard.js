import "./Dashboard.css";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Send, Bot, Volume2, RefreshCw } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);
export default function Dashboard() {
  const [resultData, setResultData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeSection, setActiveSection] = useState("form");
  const [showStatus, setShowStatus] = useState(false);
   
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your AI Loan Advisor." }
  ]);
  // 1. Chatbot States
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
    
  // 2. 12 Services Knowledge Base (Instant Answers)
  const serviceData = {
    "Loan Eligibility": "Eligibility: Age 21-60, Min salary $2500, and CIBIL score above 750.",
    "Interest Rates": "Home Loans start at 8.5%, Personal Loans at 10.5%, and Car Loans at 9.2%.",
    "Required Documents": "Prepare your PAN, Aadhaar, 3 months salary slips, and bank statements.",
    "CIBIL Score": "A score above 750 is excellent. You can check yours for free on our app.",
    "EMI Calculator": "Please provide your Loan Amount, Tenure, and Interest Rate to calculate.",
    "Govt Schemes": "We support PMAY (Interest Subsidy) and Stand-Up India schemes.",
    "Women Schemes": "Women applicants get a 0.5% interest concession and zero processing fees.",
    "Report Fraud": "Call 1930 immediately to report fraud. Never share your OTP.",
    "Fixed Deposit": "FD rates are 7.5% for 1 year, with an extra 0.5% for senior citizens.",
    "Credit Card": "We offer Rewards, Fuel, and Travel cards. Compare them in the app!",
    "Application Status": "Track your application in the 'Applications' tab using your Loan ID.",
    "Branch Locator": "We have 500+ branches. Share your zip code to find the nearest one."
  };

  // 3. Text-to-Speech (Spelling Out the Answers)
  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // 4. Hugging Face AI Integration
  const fetchAIResponse = async (userText) => {
    setIsTyping(true);

    // Check if it's a service button click
    if (serviceData[userText]) {
      setTimeout(() => {
        const reply = serviceData[userText];
        setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
        speakText(reply);
        setIsTyping(false);
      }, 600);
      return;
    }

    // Otherwise, call Hugging Face LLM
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        {
          headers: {
            Authorization: "Bearer hf_your_token_here", // Replace with your actual token
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: `[INST] You are a SmartBank Advisor. Answer in 2 short sentences. User: ${userText} [/INST]`,
          }),
        }
      );
      const data = await response.json();
      const aiText = data[0]?.generated_text?.split("[/INST]")[1]?.trim() || "I am here to help!";
      
      setMessages((prev) => [...prev, { sender: "bot", text: aiText }]);
      speakText(aiText);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "AI is currently busy. Try again!" }]);
    }
    setIsTyping(false);
  };

  // 5. Speech-to-Text (Voice Input)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => sendMsg(e.results[0][0].transcript);
    recognition.start();
  };

  // 6. Message Sending Logic
  const sendMsg = (text = chatInput) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setChatInput("");
    fetchAIResponse(text);
  };

  // 7. Auto-scroll to bottom
  useEffect(() => {
    if (activeSection === "chatbot") {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeSection]);
  const [formData, setFormData] = useState({
  Gender: "",
  Married: "",
  Dependents: "",
  Education: "",
  Self_Employed: "",
  ApplicantIncome: "",
  CoapplicantIncome: "",
  LoanAmount: "",
  Loan_Amount_Term: "",
  Credit_History: "",
  Property_Area: ""
});
useEffect(() => {
  if (activeSection === "applications") {
    fetch("http://localhost:5000/applications")
      .then(res => res.json())
      .then(data => {
        setApplications(data);
      })
      .catch(err => {
        console.error("Failed to load applications", err);
      });
  }
}, [activeSection]);
// Runs whenever the applications array is updated
  const navigate = useNavigate();
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/", { replace: true });
  }
}, [navigate]);


  const verifyDoc = async () => {
  setShowStatus(true);
  try {
    const response = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    setResultData(data);
    setTimeout(() => setActiveSection("result"), 1200);
  } catch (error) {
    alert("❌ Server Error");
  }
};
 
  const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

const submitForm = () => {
  // Check all fields are filled
  for (let key in formData) {
    if (formData[key] === "" || formData[key] === null) {
      alert("Please fill all the details to proceed");
      return;
    }
  }

  setActiveSection("documents");
};
  const logout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const { ctx } = chart;
    const value = chart.data.datasets[0].data[0];

    ctx.save();
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      value + "%",
      chart.width / 2,
      chart.height / 2
    );
  }
};
const downloadPDF = async () => {
  try {
    const payload = {
      ...formData,                 // ✅ user inputs
      decision: resultData.decision,
      confidence: resultData.confidence
    };

    const response = await fetch("http://localhost:5000/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("PDF generation failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Loan_Report.pdf";
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("❌ Failed to download PDF");
  }
};



  return (
    <div className="container">

      {/* ============ SIDEBAR ============ */}
      <div className="sidebar">
   <button onClick={() => setActiveSection("form")}>
  <i className="fa-solid fa-clipboard-list"></i>
  <span>Apply Loan</span>
</button>

  <button onClick={() => setActiveSection("applications")}>
    <i className="fa-solid fa-file-lines"></i>
    <span>Applications</span>
  </button>

  <button onClick={() => setActiveSection("chatbot")}>
    <i className="fa-solid fa-robot"></i>
    <span>AI Advisor</span>
  </button>

  <button onClick={logout}>
    <i className="fa-solid fa-right-from-bracket"></i>
    <span>Logout</span>
  </button>
</div>

      {/* ============ MAIN ============ */}
      <div className="main">
        {/* LOAN APPLICATION FORM (DEFAULT) */}
{activeSection === "form" && (
  <div className="section active">
    <div className="glass form-box animate-fade">

      <h2 className="form-title">Loan Application Form</h2>

      <div className="form-grid">

        <select name="Gender" onChange={handleChange}>
          <option value="">Gender</option>
          <option value="1">Male</option>
          <option value="0">Female</option>
        </select>

        <select name="Married" onChange={handleChange}>
          <option value="">Married</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>

        <select name="Dependents" onChange={handleChange}>
          <option value="">Dependents</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>

        <select name="Education" onChange={handleChange}>
          <option value="">Education</option>
          <option value="1">Graduate</option>
          <option value="0">Not Graduate</option>
        </select>

        <select name="Self_Employed" onChange={handleChange}>
          <option value="">Self Employed</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>

        <input
          name="ApplicantIncome"
          placeholder="Applicant Income"
          onChange={handleChange}
        />

        <input
          name="CoapplicantIncome"
          placeholder="Coapplicant Income"
          onChange={handleChange}
        />

        <input
          name="LoanAmount"
          placeholder="Loan Amount"
          onChange={handleChange}
        />

        <input
          name="Loan_Amount_Term"
          placeholder="Loan Term (months)"
          onChange={handleChange}
        />

        <select name="Credit_History" onChange={handleChange}>
          <option value="">Credit History</option>
          <option value="1">Good</option>
          <option value="0">Bad</option>
        </select>

        <select name="Property_Area" onChange={handleChange}>
          <option value="">Property Area</option>
          <option value="0">Rural</option>
          <option value="1">Semiurban</option>
          <option value="2">Urban</option>
        </select>

      </div>

       <div className="button-wrapper">
  <button className="submit-btn pulse" onClick={submitForm}>
    Proceed to Document Verification
  </button>
</div>


    </div>
  </div>
)}




        {/* DOCUMENT VERIFICATION */}
        {activeSection === "documents" && (
          <div className="section active">
            <div className="glass doc-box">
              <h2>Aadhaar Verification</h2>
              <p>Please upload your Aadhaar card to proceed.</p>

              <input type="file" accept="image/*,.pdf" />

              <button className="submit-btn" onClick={verifyDoc}>
                Submit for Verification
              </button>

              {showStatus && (
                <div className="status success">
                  ✅ Aadhaar submitted successfully
                </div>
              )}
            </div>
          </div>
        )}

{/* ================= RESULT SECTION ================= */}
{/* ================= RESULT SECTION ================= */}
{activeSection === "result" && resultData && (
  <div className="section active">
    <div className="glass result-box animate-fade">
      <h2 className="form-title">Loan Evaluation Result</h2>

      {/* ===== STATUS CARDS ===== */}
      <div className="result-grid">
        
        {/* ELIGIBILITY CARD WITH TICK/CROSS */}
        <div className={`status-card ${resultData.decision === "Approved" ? "eligible" : "not-eligible"}`}>
          <div className="status-icon-wrapper">
            {resultData.decision === "Approved" ? (
              <i className="fa-solid fa-circle-check success-tick"></i>
            ) : (
              <i className="fa-solid fa-circle-xmark failure-cross"></i>
            )}
          </div>
          <h3>Loan Status</h3>
          <p><strong>{resultData.decision === "Approved" ? "Approved" : "Rejected"}</strong></p>
        </div>

        <div className="status-card">
          <h3>Prediction Confidence</h3>
          <p>{resultData.confidence}%</p>
        </div>

        <div className="status-card">
          <h3>Model Accuracy</h3>
          <p>{resultData.accuracy}%</p>
        </div>
      </div>

      {/* ===== GRAPHS ===== */}
      <div className="graph-grid">
        <div className="graph-card">
          <Bar
            data={{
              labels: ["Income", "Loan Amount", "Monthly EMI"],
              datasets: [{
                label: "Amount (₹)",
                data: [resultData.chart.income, resultData.chart.loan, resultData.chart.emi],
                backgroundColor: ["#4fc3f7", "#81c784", "#ffb74d"],
                borderRadius: 8,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#ffffff" }, grid: { display: false } },
                y: { ticks: { color: "#ffffff" }, grid: { color: "rgba(255,255,255,0.15)" } }
              }
            }}
          />
        </div>

        <div className="graph-card">
          <h3>Approval Probability</h3>
          <Doughnut
            data={{
              labels: ["Approval Chance", "Risk"],
              datasets: [{
                data: [resultData.confidence, 100 - resultData.confidence],
                backgroundColor: ["#00e676", "#ff5252"],
                borderWidth: 0
              }]
            }}
            options={{
              cutout: "70%",
              plugins: { legend: { labels: { color: "#ffffff" } } }
            }}
            plugins={[centerTextPlugin]}
          />
        </div>
      </div>

      <div className="button-wrapper">
  <button className="submit-btn pulse" onClick={downloadPDF}>
    <i className="fa-solid fa-file-pdf"></i> Download Loan Report
  </button>
</div>


    </div> {/* End glass result-box */}
  </div> /* End section active */
)}

        {/* ============ CHATBOT / AI ADVISOR SECTION ============ */}
{activeSection === "chatbot" && (
  <div className="section active">
    <div className="glass chat-container animate-fade">
      
      {/* Header with Status */}
      <div className="chat-header-custom">
        <div className="flex-row items-center gap-10">
          <div className="bot-status-icon">
            <Bot size={20} color="white" />
          </div>
          <div>
            <h3 className="m-0">AI Loan Advisor</h3>
            <span className="text-online">● Online & Ready to Assist</span>
          </div>
        </div>
        <button className="reset-btn" onClick={() => setMessages([{ sender: "bot", text: "Hello! How can I help you with your loan today?" }])}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages Window */}
      <div className="chat-messages-window">
        {messages.map((m, i) => (
          <div key={i} className={`message-row ${m.sender}`}>
            <div className={`message-bubble ${m.sender}`}>
              {m.text}
              {m.sender === "bot" && (
                <button className="voice-replay" onClick={() => speakText(m.text)}>
                  <Volume2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="typing-status">SmartBank is thinking...</div>}
        <div ref={scrollRef} />
      </div>

      {/* The 12 Service Pills */}
      <div className="services-grid-wrapper">
        <div className="pill-scroll">
          {Object.keys(serviceData).map((service) => (
            <button key={service} onClick={() => sendMsg(service)} className="service-pill">
              {service}
            </button>
          ))}
        </div>
      </div>

      {/* Input Footer */}
      <div className="chat-input-footer">
        <button className={`mic-btn ${isListening ? 'active' : ''}`} onClick={handleVoiceInput}>
          <Mic size={20} />
        </button>
        <input 
          type="text" 
          value={chatInput} 
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
          placeholder="Type your financial question..."
        />
        <button className="send-action-btn" onClick={() => sendMsg()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  </div>
)}

        {/* APPLICATIONS */}
        {activeSection === "applications" && (
  <div className="section active">
    <div className="glass applications-box">
      <h2>My Applications</h2>

      <table className="app-table">
        <thead>
          <tr>
            <th>Loan ID</th>
            <th>Loan Amount</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>
          {applications.length > 0 ? (
            applications.map((app, index) => (
              <tr key={index}>
                <td>{app.loan_id}</td>

                <td>₹ {app.loan_amount}</td>

                <td
                  className={
                    app.status === "Approved"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  <strong>{app.status}</strong>
                </td>

                <td>{app.reason}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                No applications submitted yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

      </div>
    </div>
  );
}
