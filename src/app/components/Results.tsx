import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { recommendPlays, roiRanges } from "../lib/roi";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const scan = location.state?.scan;
  const url = location.state?.url;

  // For demo, use dummy intent/constraint; in real app, collect from user
  const intent = "lead_generation";
  const constraint = "no_dev_time";
  const plays = recommendPlays(scan || {}, intent, constraint);

  return (
    <div>
      <h2>Scan Results</h2>
      {scan ? (
        <div>
          <div><b>URL:</b> {url}</div>
          <div><b>Title:</b> {scan.title}</div>
          <div><b>Meta Description:</b> {scan.metas?.description}</div>
          <div><b>H1s:</b> {(scan.h1||[]).join(", ")}</div>
          <div><b>Detected Scripts:</b> {(scan.detected||[]).join(", ")}</div>
          <div><b>Schema:</b> {scan.hasSchema ? "Yes" : "No"}</div>
          <div><b>Sitemap:</b> {scan.hasSitemap ? "Yes" : "No"}</div>
          <div><b>Contact/Booking Link:</b> {scan.contactDetect ? "Yes" : "No"}</div>
          <hr />
          <h3>Recommended Plays</h3>
          {plays.map(play => {
            const roi = roiRanges(play, {});
            return (
              <div key={play} style={{ marginBottom: 16, border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                <b>{play === "missed_call_booking" ? "Missed-Call → SMS → Booking" : "FAQ → On-Page Q&A"}</b>
                <div>ROI: Low {roi.low}, Likely {roi.likely}, High {roi.high}</div>
              </div>
            );
          })}
          <button onClick={() => navigate("/pick", { state: { scan, url, plays } })}>
            Pick Your Win
          </button>
        </div>
      ) : (
        <div>No scan data. Please run a scan first.</div>
      )}
    </div>
  );
}
