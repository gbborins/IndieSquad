import { motion } from 'framer-motion';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 20 }) {
  return (
    <img
      src={`${ICON_BASE}/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", filter: "invert(1)", flexShrink: 0 }}
    />
  );
}

const AGENT_META = {
  orchestrator: { name: 'Maestro',  role: 'Orchestrator', icon: 'gamepad', color: '#ff5555', desc: 'Cria o plano tático da missão' },
  planner:      { name: 'Stratego', role: 'Planner',      icon: 'clipboard', color: '#55aaff', desc: 'Define estratégia e SEO' },
  blog_writer:  { name: 'Scribe',   role: 'Writer',       icon: 'edit', color: '#55ff55', desc: 'Redige textos finais' },
  designer:     { name: 'Pixel',    role: 'Designer',     icon: 'paint-bucket', color: '#ffaa55', desc: 'Gera assets visuais' },
};

const STATUS_CONFIG = {
  idle:        { label: 'Standby',     dotClass: 'dot-idle',    icon: 'moon' },
  typing:      { label: 'Trabalhando', dotClass: 'dot-typing',  icon: 'loader' },
  reading:     { label: 'Analisando',  dotClass: 'dot-reading', icon: 'search' },
  waiting:     { label: 'Aguardando',  dotClass: 'dot-waiting', icon: 'alert' },
};

function getStatusFromTask(status) {
  if (status === 'in_progress') return 'typing';
  if (status === 'in_review')   return 'waiting';
  if (status === 'reading')     return 'reading';
  return 'idle';
}

export default function AgentStatusPanel({ agentStatuses = {}, workflowLog = [], selectedAgent, onAgentClick }) {
  const agentIds = Object.keys(AGENT_META);

  return (
    <div className="agent-status-panel" id="agent-status-panel">
      <div className="panel-header">
        <PixelIcon name="users" size={18} />
        <span>Esquadrão</span>
      </div>

      <div className="agent-cards-list">
        {agentIds.map((id) => {
          const meta = AGENT_META[id];
          const rawStatus = agentStatuses[id] || 'idle';
          const state = getStatusFromTask(rawStatus);
          const cfg = STATUS_CONFIG[state];
          const isSelected = selectedAgent === id;

          return (
            <motion.div
              key={id}
              className={`guild-agent-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onAgentClick?.(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderLeftColor: meta.color }}
            >
              <div className="guild-agent-avatar" style={{ background: meta.color + '22' }}>
                <PixelIcon name={meta.icon} size={20} />
              </div>
              <div className="guild-agent-info">
                <div className="guild-agent-name">{meta.name}</div>
                <div className="guild-agent-role">{meta.role}</div>
                <div className={`guild-agent-status ${cfg.dotClass}`}>
                  <span className="status-dot" />
                  {cfg.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Timeline */}
      <div className="guild-timeline">
        <div className="panel-header" style={{ marginTop: 8 }}>
          <PixelIcon name="timeline" size={16} />
          <span>Atividade Recente</span>
        </div>

        {workflowLog.length === 0 ? (
          <p className="timeline-empty">Nenhuma atividade recente.</p>
        ) : (
          <div className="timeline-list">
            {workflowLog.slice(-6).reverse().map((entry, idx) => {
              const meta = AGENT_META[entry.agent];
              return (
                <div key={idx} className="timeline-entry">
                  <div className="timeline-dot" style={{ background: meta?.color || '#888' }} />
                  <div className="timeline-content">
                    <span className="timeline-agent">{meta?.name || entry.agent}</span>
                    <span className="timeline-action">{entry.action || entry.summary || 'Executou ação'}</span>
                    <span className="timeline-time">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
