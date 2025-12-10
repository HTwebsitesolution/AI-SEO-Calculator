import React, { useState } from "react";
import { useLocation } from "react-router-dom";

export default function PickYourWin() {
  const location = useLocation();
  const scan = location.state?.scan;
  const url = location.state?.url;
  const plays = location.state?.plays || [];
  const [selected, setSelected] = useState(plays[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startSprint() {
    setLoading(true);
    setError("");
    try {
      // TODO: Replace with real orgId logic
      const orgId = "demo-org";
      const res = await fetch("/.netlify/functions/stripe-webhook?mode=checkout", {
        method: "POST",
        body: JSON.stringify({ orgId })
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Pick Your Win</h2>
      {plays.length === 0 ? <div>No plays available.</div> : (
        <form onSubmit={e => { e.preventDefault(); startSprint(); }}>
          {plays.map(play => (
            <label key={play} style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="play"
                value={play}
                checked={selected === play}
                onChange={() => setSelected(play)}
              />
              {play === "missed_call_booking" ? "Missed-Call → SMS → Booking" : "FAQ → On-Page Q&A"}
            </label>
          ))}
          <button type="submit" disabled={loading}>{loading ? "Redirecting..." : "Start Sprint (Checkout)"}</button>
          {error && <div style={{ color: "red" }}>{error}</div>}
        </form>
      )}
    </div>
  );
}
