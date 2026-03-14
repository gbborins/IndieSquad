import React from "react";

export default function AgentRoster({ tasks, activeAgents }) {
  // Estado base dos agentes
  const squadState = {
    orchestrator: { name: "Orquestrador", role: "Mission Control", status: "Idle", color: "var(--secondary)" },
    blog_writer: { name: "Redator", role: "Blog Writer", status: "Idle", color: "var(--primary)" },
  };

  // Infere o status dos agentes baseado nas tarefas em andamento do Kanban
  const isDrafting = tasks.some(t => t.status === "draft");
  const isWaitingApproval = tasks.some(t => t.status === "pending_approval");
  const isRunning = tasks.some(t => t.status === "running");

  if (isDrafting) {
    squadState.orchestrator.status = "Planejando...";
    squadState.orchestrator.color = "var(--tertiary)";
  } else if (isWaitingApproval) {
    squadState.orchestrator.status = "Aguardando Humano";
    squadState.blog_writer.status = "Standby";
  } else if (isRunning) {
    squadState.orchestrator.status = "Monitorando";
    squadState.blog_writer.status = "Escrevendo...";
    squadState.blog_writer.color = "var(--tertiary)";
  }

  return (
    <div className="agent-roster">
      <h3>[ SQUAD ATIVO ]</h3>
      <div className="roster-grid">
        {Object.entries(squadState).map(([id, agent]) => (
          <div key={id} className={`agent-card ${agent.status !== 'Idle' && agent.status !== 'Standby' ? 'active' : ''}`} style={{borderColor: agent.color}}>
            <div className="agent-avatar" style={{backgroundColor: agent.color}}></div>
            <div className="agent-info">
              <span className="agent-role">{agent.role}</span>
              <span className="agent-name">{agent.name}</span>
              <span className="agent-status" style={{color: agent.color}}>&gt; {agent.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
