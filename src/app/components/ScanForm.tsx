import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ScanForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/.netlify/functions/scan-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      // Pass scan data to Results via state
      navigate("/results", { state: { scan: data.dom_signals, url } });
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleScan}>
      <h2>Scan Your Site</h2>
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com"
        required
        style={{ width: "60%", marginRight: 8 }}
      />
      <button type="submit" disabled={loading}>{loading ? "Scanning..." : "Scan"}</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}
