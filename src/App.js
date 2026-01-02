import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./LandingPage";
import Register from "./register";

import Login from "./Login";
import Dashboard from "./dashboard";





function App() {
  return (
   
    <Router basename="/TASK">
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
     
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />        
        
      </Routes>
      
    </Router>
  );
}

export default App;
