import { useEffect, useState } from "react";

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function PixelIcon({ name, size = 16 }) {
  return (
    <img
      src={`${ICON_BASE}/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", verticalAlign: "middle" }}
    />
  );
}

const agentIcons = {
  orchestrator: "gamepad",
  planner: "chart",
  blog_writer: "feather",
  designer: "image",
};

export default function CostTracker() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/stats/tokens`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Erro ao buscar stats:", err);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="cost-tracker">
      <h3>
        <PixelIcon name="wallet" size={20} /> TOKEN TRACKER
      </h3>

      <div className="cost-grid">
        <div className="cost-stat">
          <span className="cost-label">
            <PixelIcon name="arrow-right" size={14} /> Input
          </span>
          <span className="cost-value">{stats.total_tokens_in?.toLocaleString() || 0}</span>
        </div>
        <div className="cost-stat">
          <span className="cost-label">
            <PixelIcon name="arrow-left" size={14} /> Output
          </span>
          <span className="cost-value">{stats.total_tokens_out?.toLocaleString() || 0}</span>
        </div>
        <div className="cost-stat total">
          <span className="cost-label">
            <PixelIcon name="zap" size={14} /> Total
          </span>
          <span className="cost-value">{stats.total_tokens?.toLocaleString() || 0}</span>
        </div>
        <div className="cost-stat cost">
          <span className="cost-label">
            <PixelIcon name="wallet" size={14} /> Custo Est.
          </span>
          <span className="cost-value cost-usd">
            ${stats.estimated_cost_usd?.toFixed(4) || "0.0000"}
          </span>
        </div>
      </div>

      {stats.by_agent && Object.keys(stats.by_agent).length > 0 && (
        <div className="cost-agents">
          <h4><PixelIcon name="users" size={14} /> Por Agente</h4>
          {Object.entries(stats.by_agent).map(([agent, data]) => (
            <div key={agent} className="cost-agent-row">
              <span className="cost-agent-name">
                <PixelIcon name={agentIcons[agent] || "wallet"} size={14} />{" "}
                {agent}
              </span>
              <span className="cost-agent-tokens">
                {(data.tokens_in + data.tokens_out).toLocaleString()} tokens
              </span>
              <span className="cost-agent-calls">
                {data.calls}x chamadas
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="cost-footer">
        <PixelIcon name="clock" size={12} /> {stats.total_calls || 0} chamadas à API
      </div>
    </div>
  );
}
