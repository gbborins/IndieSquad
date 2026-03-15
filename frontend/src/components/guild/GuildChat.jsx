import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTask, approveTask } from '../../api/tasks';
import { AGENTS } from '../../config/agents';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";
const STORAGE_KEY = 'guild_chat_messages';

function PixelIcon({ name, size = 16 }) {
  return (
    <img
      src={`${ICON_BASE}/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", verticalAlign: "middle" }}
    />
  );
}

function generateImageUrl(prompt) {
  if (!prompt) return null;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
}

function formatPlan(plan) {
  if (!plan) return null;
  const parts = [];
  if (plan.summary || plan.strategy_summary) parts.push(plan.summary || plan.strategy_summary);
  if (plan.steps && Array.isArray(plan.steps)) {
    plan.steps.forEach((step, i) => {
      const text = typeof step === 'string' ? step : (step.step || step.description || JSON.stringify(step));
      parts.push(`${i + 1}. ${text}`);
    });
  }
  if (plan.target_audience) parts.push(`🎯 ${plan.target_audience}`);
  if (plan.tone_of_voice) parts.push(`🎙 ${plan.tone_of_voice}`);
  if (plan.seo_keywords && Array.isArray(plan.seo_keywords)) parts.push(`🔑 ${plan.seo_keywords.join(', ')}`);
  if (plan.content_structure && Array.isArray(plan.content_structure)) {
    plan.content_structure.forEach((s, i) => {
      const text = typeof s === 'string' ? s : (s.title || s.section || JSON.stringify(s));
      parts.push(`📝 ${i + 1}. ${text}`);
    });
  }
  return parts.length > 0 ? parts.join('\n') : JSON.stringify(plan, null, 2);
}

function extractImages(result) {
  const images = [];
  if (!result) return images;
  if (result.deliverables && Array.isArray(result.deliverables)) {
    result.deliverables.forEach(d => {
      if (typeof d === 'object' && d.image_prompt) {
        images.push({
          prompt: d.image_prompt,
          url: generateImageUrl(d.image_prompt),
          type: d.type || 'Visual Asset',
          description: d.description || '',
          dimensions: d.dimensions || '',
        });
      }
    });
  }
  return images;
}

function formatExecution(result) {
  if (!result) return null;
  const parts = [];
  if (result.execution_summary) parts.push(result.execution_summary);
  if (result.deliverables && Array.isArray(result.deliverables)) {
    result.deliverables.forEach((d, i) => {
      if (typeof d === 'string') { parts.push(`📦 ${d}`); }
      else {
        const title = d.type || d.title || `Item ${i + 1}`;
        parts.push(`📦 [${title}] ${d.description || d.content || ''}`);
      }
    });
  }
  if (result.art_direction) parts.push(`🎨 ${typeof result.art_direction === 'string' ? result.art_direction : JSON.stringify(result.art_direction)}`);
  return parts.length > 0 ? parts.join('\n') : JSON.stringify(result, null, 2);
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  } catch (e) { /* ignore */ }
}

function loadMessages() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  return [{ id: 'welcome', type: 'system', text: '👋 Bem-vindo, Comandante! Descreva uma missão e o esquadrão entrará em ação.', timestamp: Date.now() }];
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

export default function GuildChat({ onTaskCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isOpen]);
  useEffect(() => { if (isOpen) setUnreadCount(0); }, [isOpen]);

  const addMessage = useCallback((msg) => {
    const m = { ...msg, timestamp: msg.timestamp || Date.now() };
    setMessages(prev => [...prev, m]);
    if (!isOpen) setUnreadCount(prev => prev + 1);
  }, [isOpen]);

  // Agent-to-agent handoff message
  const addHandoff = useCallback((fromAgent, toAgent, summary) => {
    addMessage({
      id: `handoff-${Date.now()}-${Math.random()}`,
      type: 'handoff',
      fromAgent,
      toAgent,
      text: summary,
    });
  }, [addMessage]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage({ id: `user-${Date.now()}`, type: 'user', text });
    setInput('');
    setIsLoading(true);

    const lines = text.split('\n');
    const title = lines[0].length > 60 ? lines[0].substring(0, 60) + '...' : lines[0];

    try {
      const data = await createTask({ title, description: text, customer_name: null });
      const task = data.task;

      // Show agent-to-agent handoff messages
      addHandoff('user', 'orchestrator', `Nova missão recebida: "${title}"`);

      if (task.workflow_log) {
        const log = typeof task.workflow_log === 'string' ? JSON.parse(task.workflow_log) : task.workflow_log;
        if (Array.isArray(log)) {
          log.forEach((entry, i) => {
            setTimeout(() => {
              addMessage({
                id: `log-${Date.now()}-${entry.agent}-${Math.random()}`,
                type: 'agent',
                agent: entry.agent,
                text: entry.summary || entry.action || 'Processando...',
              });
              // Show handoff between agents
              if (i < log.length - 1 && log[i + 1]) {
                addHandoff(entry.agent, log[i + 1].agent, `Passando para ${AGENTS[log[i + 1].agent]?.name || log[i + 1].agent}`);
              }
            }, i * 100);
          });
        }
      }

      // Show plan
      const plan = task.agent_plan;
      const planText = formatPlan(plan);

      setTimeout(() => {
        addMessage({
          id: `plan-${task.id}`,
          type: 'agent',
          agent: 'planner',
          text: planText || 'Plano gerado com sucesso.',
          taskId: task.id,
          needsApproval: task.status === 'in_review',
          isApproved: false,
        });
      }, 200);

      onTaskCreated?.();
    } catch (err) {
      addMessage({ id: `error-${Date.now()}`, type: 'system', text: `❌ Erro: ${err.message}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(msgId, taskId) {
    setIsApproving(true);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, needsApproval: false, isApproved: true } : m));

    addHandoff('user', 'blog_writer', 'Plano aprovado! Iniciando execução...');

    try {
      const data = await approveTask(taskId);
      const task = data.task;

      if (task.workflow_log) {
        const log = typeof task.workflow_log === 'string' ? JSON.parse(task.workflow_log) : task.workflow_log;
        if (Array.isArray(log)) {
          const execLogs = log.filter(e => e.agent === 'blog_writer' || e.agent === 'designer');
          execLogs.forEach((entry, i) => {
            addMessage({
              id: `exec-log-${Date.now()}-${entry.agent}-${Math.random()}`,
              type: 'agent',
              agent: entry.agent,
              text: entry.summary || entry.action || 'Executado.',
            });
            if (i < execLogs.length - 1) {
              addHandoff(entry.agent, execLogs[i + 1].agent, `Passando para ${AGENTS[execLogs[i + 1].agent]?.name}`);
            }
          });
        }
      }

      const result = task.agent_response;
      const resultText = formatExecution(result);
      addMessage({ id: `result-${task.id}`, type: 'agent', agent: 'designer', text: resultText || 'Missão concluída!', isResult: true });

      const images = extractImages(result);
      if (images.length > 0) {
        addMessage({ id: `images-${task.id}`, type: 'images', images });
      }

      addMessage({ id: `done-${task.id}`, type: 'system', text: '🏆 Missão concluída! Relatório completo em Quests.' });
      onTaskCreated?.();
    } catch (err) {
      addMessage({ id: `exec-error-${Date.now()}`, type: 'system', text: `❌ Erro: ${err.message}`, isError: true });
    } finally {
      setIsApproving(false);
    }
  }

  function handleClear() {
    setMessages([{ id: 'welcome', type: 'system', text: '👋 Histórico limpo. Descreva uma nova missão!', timestamp: Date.now() }]);
  }

  return (
    <>
      {/* Bottom Chat Bar (always visible) */}
      <div className={`dc-chat-bar ${isOpen ? 'expanded' : ''}`} id="dc-chat-bar">
        {/* Collapsed bar */}
        {!isOpen && (
          <div className="dc-bar-collapsed" onClick={() => setIsOpen(true)}>
            <div className="dc-bar-agents">
              {Object.entries(AGENTS).map(([id, a]) => (
                <div key={id} className="dc-bar-avatar" style={{ background: a.color + '33', borderColor: a.color }} title={a.name}>
                  <span>{a.avatar}</span>
                </div>
              ))}
            </div>
            <span className="dc-bar-label">
              <PixelIcon name="message" size={14} />
              Chat da Guilda
            </span>
            {unreadCount > 0 && <span className="dc-bar-badge">{unreadCount}</span>}
            <span className="dc-bar-expand">
              <PixelIcon name="chevron-up" size={16} />
            </span>
          </div>
        )}

        {/* Expanded chat */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="dc-chat-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 420, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Header */}
              <div className="dc-chat-header">
                <span className="dc-channel-icon">#</span>
                <span className="dc-channel-name">missões-da-guilda</span>
                <div className="dc-header-agents">
                  {Object.entries(AGENTS).map(([id, a]) => (
                    <span key={id} className="dc-header-dot" style={{ background: a.color }} title={a.name} />
                  ))}
                </div>
                <button className="dc-header-btn" onClick={handleClear} title="Limpar histórico">
                  <PixelIcon name="trash" size={14} />
                </button>
                <button className="dc-header-btn" onClick={() => setIsOpen(false)} title="Minimizar">
                  <PixelIcon name="chevron-down" size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="dc-messages">
                {messages.map((msg) => {
                  if (msg.type === 'handoff') {
                    const from = AGENTS[msg.fromAgent];
                    const to = AGENTS[msg.toAgent];
                    return (
                      <div key={msg.id} className="dc-handoff">
                        <span className="dc-handoff-line" />
                        <span className="dc-handoff-text">
                          {from ? <span style={{ color: from.color }}>{from.avatar} {from.name}</span> : <span>👤 Comandante</span>}
                          {' → '}
                          {to && <span style={{ color: to.color }}>{to.avatar} {to.name}</span>}
                          {msg.text && <span className="dc-handoff-summary"> — {msg.text}</span>}
                        </span>
                        <span className="dc-handoff-line" />
                      </div>
                    );
                  }

                  if (msg.type === 'images') {
                    return (
                      <div key={msg.id} className="dc-msg">
                        <div className="dc-msg-avatar" style={{ background: AGENTS.designer.color + '33' }}>{AGENTS.designer.avatar}</div>
                        <div className="dc-msg-body">
                          <div className="dc-msg-header">
                            <span className="dc-msg-name" style={{ color: AGENTS.designer.color }}>{AGENTS.designer.name}</span>
                            <span className="dc-msg-time">{timeAgo(msg.timestamp)}</span>
                          </div>
                          <div className="dc-images-row">
                            {msg.images.map((img, idx) => (
                              <div key={idx} className="dc-image-card">
                                <img src={img.url} alt={img.description || img.prompt} loading="lazy" />
                                <div className="dc-image-label">
                                  <span className="dc-image-type">{img.type}</span>
                                  {img.dimensions && <span className="dc-image-dims">{img.dimensions}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} className={`dc-system ${msg.isError ? 'error' : ''}`}>
                        {msg.text}
                      </div>
                    );
                  }

                  if (msg.type === 'user') {
                    return (
                      <div key={msg.id} className="dc-msg user">
                        <div className="dc-msg-avatar user-avatar">👤</div>
                        <div className="dc-msg-body">
                          <div className="dc-msg-header">
                            <span className="dc-msg-name user-name">Comandante</span>
                            <span className="dc-msg-time">{timeAgo(msg.timestamp)}</span>
                          </div>
                          <div className="dc-msg-text">{msg.text}</div>
                        </div>
                      </div>
                    );
                  }

                  // Agent message
                  const agent = AGENTS[msg.agent] || AGENTS.orchestrator;
                  return (
                    <div key={msg.id} className={`dc-msg ${msg.isResult ? 'result' : ''}`}>
                      <div className="dc-msg-avatar" style={{ background: agent.color + '33' }}>{agent.avatar}</div>
                      <div className="dc-msg-body">
                        <div className="dc-msg-header">
                          <span className="dc-msg-name" style={{ color: agent.color }}>{agent.name}</span>
                          <span className="dc-msg-role">{agent.role}</span>
                          <span className="dc-msg-time">{timeAgo(msg.timestamp)}</span>
                        </div>
                        <pre className="dc-msg-text">{msg.text}</pre>
                        {msg.needsApproval && (
                          <button className="dc-approve-btn" onClick={() => handleApprove(msg.id, msg.taskId)} disabled={isApproving}>
                            {isApproving ? '⚙ Executando...' : '✅ Aprovar Execução'}
                          </button>
                        )}
                        {msg.isApproved && <span className="dc-approved">✅ Aprovado</span>}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="dc-msg">
                    <div className="dc-msg-avatar" style={{ background: AGENTS.orchestrator.color + '33' }}>{AGENTS.orchestrator.avatar}</div>
                    <div className="dc-msg-body">
                      <div className="dc-msg-header">
                        <span className="dc-msg-name" style={{ color: AGENTS.orchestrator.color }}>{AGENTS.orchestrator.name}</span>
                        <span className="dc-msg-role">está digitando</span>
                      </div>
                      <div className="dc-typing"><span /><span /><span /></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="dc-input" onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enviar uma missão para #missões-da-guilda"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isApproving}
                />
                <button type="submit" disabled={!input.trim() || isLoading || isApproving}>
                  <PixelIcon name="arrow-right" size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
