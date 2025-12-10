import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ScanForm from "./components/ScanForm";
import Results from "./components/Results";
import PickYourWin from "./components/PickYourWin";
import SetupWizard from "./components/SetupWizard";
import ProofPack from "./components/ProofPack";

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Scan</Link> | <Link to="/results">Results</Link> | <Link to="/pick">Pick Your Win</Link> | <Link to="/setup">Setup</Link> | <Link to="/proof">Proof Pack</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ScanForm />} />
        <Route path="/results" element={<Results />} />
        <Route path="/pick" element={<PickYourWin />} />
        <Route path="/setup" element={<SetupWizard playType="missed_call_booking" onSubmit={()=>{}} />} />
        <Route path="/proof" element={<ProofPack />} />
      </Routes>
    </Router>
  );
}
