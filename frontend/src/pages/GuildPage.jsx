import { useEffect, useState, useCallback } from 'react';
import PixelOffice from '../components/guild/PixelOffice';
import AgentStatusPanel from '../components/guild/AgentStatusPanel';
import { fetchAgentStatus } from '../api/agents';

export default function GuildPage() {
  const [agentStatuses, setAgentStatuses] = useState({});
  const [workflowLog, setWorkflowLog] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchAgentStatus();
      if (data.agents) {
        const statusMap = {};
        data.agents.forEach(a => { statusMap[a.name] = a.status; });
        setAgentStatuses(statusMap);
      }
      if (data.recent_log) {
        setWorkflowLog(data.recent_log);
      }
      setError(null);
    } catch (err) {
      // Don't crash — just show offline status
      console.warn('Guild status fetch failed:', err.message);
      setError('Sem conexão com o servidor');
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return (
    <div className="guild-page" id="guild-page">
      <div className="guild-canvas-area">
        <div className="guild-title-bar">
          <span className="guild-label">
            <img src="https://unpkg.com/pixelarticons@latest/svg/monitor.svg" alt="monitor" width={16} height={16} style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.5 }} />
            Guilda
          </span>
          {error && <span className="guild-offline-badge">● Offline</span>}
        </div>
        <PixelOffice
          agentStatuses={agentStatuses}
          onAgentClick={setSelectedAgent}
        />
        <p className="guild-hint">Clique em um agente para ver detalhes</p>
      </div>
      <AgentStatusPanel
        agentStatuses={agentStatuses}
        workflowLog={workflowLog}
        selectedAgent={selectedAgent}
        onAgentClick={setSelectedAgent}
      />
    </div>
  );
}
