import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type MissedCallConfig = {
  booking_url: string;
  hours: { mon_fri: string; sat: string; sun: string | null };
  twilio_phone: string;
};

type FAQConfig = {
  top_urls: string[];
  faq_urls: string[];
};

type Props = {
  playType: "missed_call_booking" | "faq_widget";
  onSubmit?: (config: any) => void;
};

export default function SetupWizard({ playType, onSubmit }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [missedCall, setMissedCall] = useState<MissedCallConfig>({
    booking_url: "",
    hours: { mon_fri: "09:00-17:00", sat: "10:00-14:00", sun: "" },
    twilio_phone: ""
  });
  const [faq, setFaq] = useState<FAQConfig>({
    top_urls: ["", "", "", "", ""],
    faq_urls: [""]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMissedCallChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("hours.")) {
      const key = name.split(".")[1];
      setMissedCall(prev => ({ ...prev, hours: { ...prev.hours, [key]: value } }));
    } else {
      setMissedCall(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFaqChange = (idx: number, value: string, type: "top" | "faq") => {
    if (type === "top") {
      setFaq(prev => {
        const arr = [...prev.top_urls];
        arr[idx] = value;
        return { ...prev, top_urls: arr };
      });
    } else {
      setFaq(prev => {
        const arr = [...prev.faq_urls];
        arr[idx] = value;
        return { ...prev, faq_urls: arr };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const config = playType === "missed_call_booking" ? missedCall : faq;
      // TODO: Replace with real orgId logic
      const orgId = "demo-org";
      const res = await fetch("/.netlify/functions/deploy-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, play_type: playType, config })
      });
      if (!res.ok) throw new Error("Deployment failed");
      navigate("/proof", { state: { playType, config } });
    } catch (err: any) {
      setError(err.message || "Deployment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {playType === "missed_call_booking" ? (
        <div>
          <h3>Missed-Call → SMS → Booking Setup</h3>
          <label>Booking URL:<br/>
            <input name="booking_url" value={missedCall.booking_url} onChange={handleMissedCallChange} required />
          </label><br/>
          <label>Twilio Phone Number:<br/>
            <input name="twilio_phone" value={missedCall.twilio_phone} onChange={handleMissedCallChange} required />
          </label><br/>
          <label>Business Hours (Mon-Fri):<br/>
            <input name="hours.mon_fri" value={missedCall.hours.mon_fri} onChange={handleMissedCallChange} required />
          </label><br/>
          <label>Business Hours (Sat):<br/>
            <input name="hours.sat" value={missedCall.hours.sat} onChange={handleMissedCallChange} />
          </label><br/>
          <label>Business Hours (Sun):<br/>
            <input name="hours.sun" value={missedCall.hours.sun || ""} onChange={handleMissedCallChange} />
          </label><br/>
        </div>
      ) : (
        <div>
          <h3>FAQ → On-Page Q&A Setup</h3>
          <label>Top 5 URLs:<br/>
            {faq.top_urls.map((url, i) => (
              <input key={i} value={url} onChange={e => handleFaqChange(i, e.target.value, "top")} placeholder={`URL #${i+1}`} required={i===0} />
            ))}
          </label><br/>
          <label>FAQ URLs:<br/>
            {faq.faq_urls.map((url, i) => (
              <input key={i} value={url} onChange={e => handleFaqChange(i, e.target.value, "faq")} placeholder={`FAQ URL #${i+1}`} required={i===0} />
            ))}
            <button type="button" onClick={() => setFaq(prev => ({ ...prev, faq_urls: [...prev.faq_urls, ""] }))}>Add FAQ URL</button>
          </label><br/>
        </div>
      )}
      <button type="submit" disabled={loading}>{loading ? "Deploying..." : "Save & Continue"}</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}
