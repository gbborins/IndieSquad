import { motion } from 'framer-motion';
import { AGENTS } from '../../config/agents';

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

export default function AgentStatusPanel({ agentStatuses = {}, workflowLog = [], selectedAgent, onAgentClick, unreadCounts = {} }) {
  const agentIds = Object.keys(AGENTS);

  return (
    <div className="agent-status-panel" id="agent-status-panel">
      <div className="panel-header">
        <PixelIcon name="users" size={18} />
        <span>Esquadrão</span>
      </div>

      <div className="agent-cards-list">
        {agentIds.map((id) => {
          const meta = AGENTS[id];
          const rawStatus = agentStatuses[id] || 'idle';
          const state = getStatusFromTask(rawStatus);
          const cfg = STATUS_CONFIG[state];
          const isSelected = selectedAgent === id;
          const unread = unreadCounts[id] || 0;

          return (
            <motion.div
              key={id}
              className={`guild-agent-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onAgentClick?.(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderLeftColor: meta.color }}
            >
              <div className="guild-agent-avatar" style={{ background: meta.color + '22', position: 'relative' }}>
                <PixelIcon name={meta.icon} size={20} />
                {unread > 0 && (
                  <span className="agent-unread-badge">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
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
    </div>
  );
}
