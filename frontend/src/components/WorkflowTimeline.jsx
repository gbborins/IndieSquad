import React from "react";

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 24, color }) {
  return (
    <img
      src={`${ICON_BASE}/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{ filter: color ? `drop-shadow(0 0 0 ${color})` : undefined, imageRendering: "pixelated" }}
    />
  );
}

const agentIcons = {
  orchestrator: "gamepad",
  planner: "chart",
  blog_writer: "edit",
  designer: "paint-bucket",
};

const agentNames = {
  orchestrator: "Orquestrador",
  planner: "Planejador",
  blog_writer: "Redator",
  designer: "Designer",
};

export default function WorkflowTimeline({ log }) {
  if (!log || log.length === 0) return null;

  const parsedLog = typeof log === "string" ? JSON.parse(log) : log;

  return (
    <div className="workflow-timeline">
      <h4>
        <PixelIcon name="script" size={18} /> WORKFLOW LOG
      </h4>
      <div className="timeline-track">
        {parsedLog.map((entry, i) => (
          <div key={i} className={`timeline-step ${entry.status}`}>
            <div className="timeline-dot">
              <PixelIcon name={agentIcons[entry.agent] || "coin"} size={20} />
            </div>
            <div className="timeline-content">
              <span className="timeline-agent">
                {agentNames[entry.agent] || entry.agent}
              </span>
              <span className="timeline-action">{entry.action}</span>
              {entry.summary && (
                <p className="timeline-summary">{entry.summary}</p>
              )}
              <span className="timeline-time">
                <PixelIcon name="clock" size={12} />{" "}
                {new Date(entry.timestamp).toLocaleTimeString("pt-BR")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
