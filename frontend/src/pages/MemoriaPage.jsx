import { useState } from 'react';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

const MEMORY_SECTIONS = [
  { title: 'Instruções do Agente', key: 'agent_instructions', icon: 'scroll',
    desc: 'Regras e comportamento definidos para cada agente da guilda.',
    items: [
      { agent: 'Maestro', content: 'Orquestra a equipe. Cria planos táticos baseados no briefing do usuário.' },
      { agent: 'Stratego', content: 'Define estratégia de marketing, SEO, e posicionamento de conteúdo.' },
      { agent: 'Scribe', content: 'Redige textos finais como blog posts, copies e documentação.' },
      { agent: 'Pixel', content: 'Gera prompts de imagem e conceitos visuais para os assets do projeto.' },
    ]},
  { title: 'Contexto do Projeto', key: 'project_context', icon: 'booklet',
    desc: 'Informações globais que os agentes usam para manter coerência.',
    items: [
      { agent: 'Sistema', content: 'Tema: Indie Game Studio · Stack: React + PHP + Supabase · Estilo: Pixel Art Dark Theme' },
    ]},
  { title: 'Histórico de Tasks', key: 'task_history', icon: 'archive',
    desc: 'Registro das tarefas anteriores e seus resultados.',
    items: [] },
];

export default function MemoriaPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="page-container">
      <div className="page-header">
        <img src={`${ICON_BASE}/server.svg`} alt="memoria" width={20} height={20}
          style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.5 }} />
        <span>Memória</span>
      </div>
      <p className="page-description">Base de conhecimento compartilhada entre os agentes da guilda.</p>

      <div className="memory-sections">
        {MEMORY_SECTIONS.map((sec) => (
          <div key={sec.key} className={`memory-card ${expanded === sec.key ? 'expanded' : ''}`}
            onClick={() => setExpanded(expanded === sec.key ? null : sec.key)}>
            <div className="memory-card-header">
              <img src={`${ICON_BASE}/${sec.icon}.svg`} alt={sec.icon} width={18} height={18}
                style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.6 }} />
              <span className="memory-card-title">{sec.title}</span>
              <span className="memory-card-count">{sec.items.length} itens</span>
            </div>
            <p className="memory-card-desc">{sec.desc}</p>
            {expanded === sec.key && (
              <div className="memory-items">
                {sec.items.length === 0 ? (
                  <p className="memory-empty">Nenhum registro salvo ainda.</p>
                ) : sec.items.map((item, i) => (
                  <div key={i} className="memory-item">
                    <span className="memory-item-agent">{item.agent}</span>
                    <span className="memory-item-content">{item.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
