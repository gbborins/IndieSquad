const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

const AGENTS_INFO = [
  { name: 'Maestro', role: 'Orchestrator', emoji: '🎮', color: '#ff5555',
    desc: 'Orquestra a equipe e cria planos táticos baseados no briefing do usuário.',
    skills: ['Planejamento', 'Distribuição de tarefas', 'Revisão de qualidade'],
    model: 'DeepSeek R1' },
  { name: 'Stratego', role: 'Planner', emoji: '📋', color: '#55aaff',
    desc: 'Define estratégias de SEO, posicionamento de conteúdo e análise de mercado.',
    skills: ['SEO', 'Análise competitiva', 'Estratégia de conteúdo'],
    model: 'DeepSeek R1' },
  { name: 'Scribe', role: 'Writer', emoji: '✍️', color: '#55ff55',
    desc: 'Redige textos finais como blog posts, copies e documentação técnica.',
    skills: ['Redação', 'Copywriting', 'Documentação'],
    model: 'DeepSeek V3' },
  { name: 'Pixel', role: 'Designer', emoji: '🎨', color: '#ffaa55',
    desc: 'Gera prompts de imagem e conceitos visuais para assets do projeto.',
    skills: ['Design Visual', 'Concept Art', 'Prompt Engineering'],
    model: 'DeepSeek V3' },
];

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
        {AGENTS_INFO.map(agent => (
          <div key={agent.name} className="npc-profile-card" style={{ borderTopColor: agent.color }}>
            <div className="npc-profile-header">
              <div className="npc-avatar" style={{ background: agent.color + '22' }}>
                <span className="npc-emoji">{agent.emoji}</span>
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
