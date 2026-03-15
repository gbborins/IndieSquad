import React from "react";

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 24 }) {
  return (
    <img
      src={`${ICON_BASE}/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

const agentIcons = {
  orchestrator: "gamepad",
  planner: "chart",
  blog_writer: "feather",
  designer: "image",
};

export default function AgentRoster({ tasks, activeAgents, isSubmitting, isApproving }) {
  const squadState = {
    orchestrator: { name: "Orquestrador", role: "Mission Control", status: "Idle", color: "var(--secondary)", icon: "gamepad" },
    planner: { name: "Planejador", role: "Estratégia", status: "Idle", color: "#A855F7", icon: "chart" },
    blog_writer: { name: "Redator", role: "Blog Writer", status: "Idle", color: "var(--primary)", icon: "feather" },
    designer: { name: "Designer", role: "Visual Assets", status: "Idle", color: "#F59E0B", icon: "image" },
  };

  const isWaitingApproval = tasks.some(t => t.status === "in_review");

  if (isSubmitting) {
    squadState.orchestrator.status = "Planejando...";
    squadState.orchestrator.color = "var(--tertiary)";
    squadState.planner.status = "Analisando...";
    squadState.planner.color = "var(--tertiary)";
  } else if (isApproving) {
    squadState.orchestrator.status = "Monitorando";
    squadState.planner.status = "Monitorando";
    squadState.blog_writer.status = "Escrevendo...";
    squadState.blog_writer.color = "var(--tertiary)";
    squadState.designer.status = "Criando Assets...";
    squadState.designer.color = "var(--tertiary)";
  } else if (isWaitingApproval) {
    squadState.orchestrator.status = "Aguardando Humano";
    squadState.planner.status = "Standby";
    squadState.blog_writer.status = "Standby";
    squadState.designer.status = "Standby";
  }

  return (
    <div className="agent-roster">
      <h3><PixelIcon name="users" size={20} /> SQUAD ATIVO</h3>
      <div className="roster-grid">
        {Object.entries(squadState).map(([id, agent]) => (
          <div key={id} className={`agent-card ${agent.status !== 'Idle' && agent.status !== 'Standby' ? 'active' : ''}`} style={{ borderColor: agent.color }}>
            <div className="agent-avatar" style={{ backgroundColor: agent.color }}>
              <PixelIcon name={agent.icon} size={32} />
            </div>
            <div className="agent-info">
              <span className="agent-role">{agent.role}</span>
              <span className="agent-name">{agent.name}</span>
              <span className="agent-status" style={{ color: agent.color }}>
                <PixelIcon name="chevron-right" size={12} /> {agent.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
