import React from "react";
import { AGENTS } from '../config/agents';

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

export default function AgentRoster({ tasks, activeAgents, isSubmitting, isApproving }) {
  const squadState = {
    orchestrator: { name: AGENTS.orchestrator.name, role: 'Mission Control', status: 'Idle', color: AGENTS.orchestrator.color, icon: AGENTS.orchestrator.icon },
    planner:      { name: AGENTS.planner.name, role: 'Estratégia', status: 'Idle', color: AGENTS.planner.color, icon: AGENTS.planner.icon },
    blog_writer:  { name: AGENTS.blog_writer.name, role: 'Blog Writer', status: 'Idle', color: AGENTS.blog_writer.color, icon: AGENTS.blog_writer.icon },
    designer:     { name: AGENTS.designer.name, role: 'Visual Assets', status: 'Idle', color: AGENTS.designer.color, icon: AGENTS.designer.icon },
  };

  const isWaitingApproval = tasks.some(t => t.status === "in_review");

  if (isSubmitting) {
    squadState.orchestrator.status = "Planejando...";
    squadState.orchestrator.color = AGENTS.orchestrator.color;
    squadState.planner.status = "Analisando...";
    squadState.planner.color = AGENTS.planner.color;
  } else if (isApproving) {
    squadState.orchestrator.status = "Monitorando";
    squadState.planner.status = "Monitorando";
    squadState.blog_writer.status = "Escrevendo...";
    squadState.blog_writer.color = AGENTS.blog_writer.color;
    squadState.designer.status = "Criando Assets...";
    squadState.designer.color = AGENTS.designer.color;
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
