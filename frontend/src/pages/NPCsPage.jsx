import { AGENTS, AGENTS_LIST } from '../config/agents';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

export default function NPCsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <img src={`${ICON_BASE}/robot.svg`} alt="npcs" width={20} height={20}
          style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.5 }} />
        <span>NPCs — Agentes do Esquadrão</span>
      </div>
      <p className="page-description">Conheça cada membro da guilda e suas especialidades.</p>

      <div className="npcs-grid">
        {AGENTS_LIST.map(agent => (
          <div key={agent.name} className="npc-profile-card" style={{ borderTopColor: agent.color }}>
            <div className="npc-profile-header">
              <div className="npc-avatar" style={{ background: agent.color + '22' }}>
                <span className="npc-emoji">{agent.avatar}</span>
              </div>
              <div>
                <h3 className="npc-name">{agent.name}</h3>
                <span className="npc-role" style={{ color: agent.color }}>{agent.role}</span>
              </div>
            </div>
            <p className="npc-desc">{agent.desc}</p>
            <div className="npc-skills">
              {agent.skills.map(s => (
                <span key={s} className="npc-skill-tag" style={{ borderColor: agent.color + '44', color: agent.color }}>{s}</span>
              ))}
            </div>
            <div className="npc-model">
              <img src={`${ICON_BASE}/processor.svg`} alt="model" width={12} height={12}
                style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.4 }} />
              <span>{agent.model}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
