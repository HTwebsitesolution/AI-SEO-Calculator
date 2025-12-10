import React, { useEffect, useState } from "react";

function SimpleLineChart({ chart }: { chart: any }) {
  // Render a simple SVG line chart for demo
  if (!chart || !chart.data || chart.data.length < 2) return null;
  const width = 300,
    height = 100,
    padding = 30;
  const values = chart.data.map((d: any) => d.value);
  const min = Math.min(...values),
    max = Math.max(...values);
  const points = chart.data
    .map((d: any, i: number) => {
      const x =
        padding + (i * (width - 2 * padding)) / (chart.data.length - 1);
      const y =
        height -
        padding -
        ((d.value - min) / (max - min || 1)) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      style={{ background: "#f8f8f8", margin: "1em 0" }}
    >
      <polyline
        fill="none"
        stroke="#0074d9"
        strokeWidth="2"
        points={points}
      />
      {chart.data.map((d: any, i: number) => {
        const x =
          padding + (i * (width - 2 * padding)) / (chart.data.length - 1);
        const y =
          height -
          padding -
          ((d.value - min) / (max - min || 1)) * (height - 2 * padding);
        return <circle key={i} cx={x} cy={y} r={3} fill="#0074d9" />;
      })}
      {/* X axis labels */}
      {chart.data.map((d: any, i: number) => {
        const x =
          padding + (i * (width - 2 * padding)) / (chart.data.length - 1);
        return (
          <text
            key={i}
            x={x}
            y={height - 10}
            fontSize="10"
            textAnchor="middle"
          >
            {d.date}
          </text>
        );
      })}
      {/* Y axis min/max */}
      <text x={5} y={height - padding} fontSize="10">
        {min}
      </text>
      <text x={5} y={padding} fontSize="10">
        {max}
      </text>
    </svg>
  );
}

export default function ProofPack() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rollbackMsg, setRollbackMsg] = useState("");

  useEffect(() => {
    async function fetchProof() {
      setLoading(true);
      setError("");
      try {
        // TODO: Replace with real deployment_id
        const deployment_id = "demo-deploy";
        const res = await fetch(
          `/api/proofpack?deployment_id=${deployment_id}`
        );
        if (!res.ok) throw new Error("Failed to fetch proof pack");
        setData(await res.json());
      } catch (err: any) {
        setError(err.message || "Failed to fetch proof pack");
      } finally {
        setLoading(false);
      }
    }
    fetchProof();
  }, []);

  async function handleRollback() {
    setRollbackMsg("");
    try {
      // TODO: Replace with real deployment_id
      const deployment_id = "demo-deploy";
      const res = await fetch("/.netlify/functions/rollback-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deployment_id }),
      });
      if (!res.ok) throw new Error("Rollback failed");
      setRollbackMsg("Rollback successful.");
    } catch (err: any) {
      setRollbackMsg(err.message || "Rollback failed");
    }
  }

  if (loading) return <div>Loading Proof Pack…</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!data) return <div>No proof data.</div>;

  return (
    <div>
      <h2>Proof Pack</h2>
      <div>
        <b>KPI:</b> {data.kpi}
      </div>
      <div>
        <b>Baseline:</b> {data.baseline_value}
      </div>
      <div>
        <b>Assessment:</b> {data.assess_value}
      </div>
      <div>
        <b>Lift %:</b> {data.lift_pct}
      </div>
      <div>
        <b>Passed Threshold:</b>{" "}
        {data.passed_threshold_bool ? "Yes" : "No"}
      </div>
      {Array.isArray(data.charts) &&
        data.charts.map((chart: any, i: number) => (
          <div key={i}>
            <div>
              <b>{chart.label}</b>
            </div>
            <SimpleLineChart chart={chart} />
          </div>
        ))}
      <button onClick={handleRollback}>Rollback</button>
      {rollbackMsg && <div>{rollbackMsg}</div>}
    </div>
  );
}
