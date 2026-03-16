import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchChatMessages, sendChatMessage, clearChatMessages } from '../../api/chat';
import { AGENTS } from '../../config/agents';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

const AGENT_META = {
  orchestrator: { name: AGENTS.orchestrator.name, icon: AGENTS.orchestrator.icon, color: AGENTS.orchestrator.color },
  planner: { name: AGENTS.planner.name, icon: AGENTS.planner.icon, color: AGENTS.planner.color },
  blog_writer: { name: AGENTS.blog_writer.name, icon: AGENTS.blog_writer.icon, color: AGENTS.blog_writer.color },
  designer: { name: AGENTS.designer.name, icon: AGENTS.designer.icon, color: AGENTS.designer.color },
};

function PixelIcon({ name, size = 18 }) {
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

function TypingIndicator() {
  return (
    <div className="chat-typing-indicator">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function ChatBubble({ msg, isUser, agentMeta }) {
  // Parse [IMG:url] markers from content
  const imgRegex = /\[IMG:(https?:\/\/[^\]]+)\]/g;
  const images = [];
  let match;
  while ((match = imgRegex.exec(msg.content)) !== null) {
    images.push(match[1]);
  }
  // Clean text content (remove [IMG:...] markers)
  const textContent = msg.content.replace(imgRegex, '').trim();

  return (
    <motion.div
      className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {!isUser && (
        <div className="chat-bubble-avatar" style={{ background: (agentMeta?.color || '#ff5555') + '22' }}>
          <PixelIcon name={agentMeta?.icon || 'gamepad'} size={16} />
        </div>
      )}
      <div className="chat-bubble-content">
        {!isUser && (
          <span className="chat-bubble-name" style={{ color: agentMeta?.color || '#ff5555' }}>
            {agentMeta?.name || 'Agente'}
          </span>
        )}
        {textContent && <p className="chat-bubble-text">{textContent}</p>}
        {images.length > 0 && (
          <div className="chat-bubble-images">
            {images.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="chat-image-card">
                <img
                  src={url}
                  alt="Imagem gerada pelo Pixel"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            ))}
          </div>
        )}
        <span className="chat-bubble-time">
          {msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ activeAgent = 'orchestrator', onUnreadChange }) {
  // Per-agent message cache
  const [messagesMap, setMessagesMap] = useState({});
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevAgentRef = useRef(activeAgent);

  const agentMeta = AGENT_META[activeAgent] || AGENT_META.orchestrator;
  const messages = messagesMap[activeAgent] || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages when agent changes or chat opens
  useEffect(() => {
    if (!isOpen) return;
    fetchChatMessages(activeAgent)
      .then((data) => {
        setMessagesMap((prev) => ({
          ...prev,
          [activeAgent]: data.messages || [],
        }));
        setError(null);
        // Clear unread for this agent
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[activeAgent];
          return next;
        });
      })
      .catch(() => setError('Sem conexão com o servidor'))
      .finally(() => setTimeout(scrollToBottom, 100));
  }, [isOpen, activeAgent, scrollToBottom]);

  // Clear unread when switching to an agent
  useEffect(() => {
    if (prevAgentRef.current !== activeAgent) {
      prevAgentRef.current = activeAgent;
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[activeAgent];
        return next;
      });
    }
  }, [activeAgent]);

  // Propagate unread counts to parent
  useEffect(() => {
    onUnreadChange?.(unreadCounts);
  }, [unreadCounts, onUnreadChange]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    const userMsg = { role: 'user', content, created_at: new Date().toISOString() };
    setMessagesMap((prev) => ({
      ...prev,
      [activeAgent]: [...(prev[activeAgent] || []), userMsg],
    }));
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const data = await sendChatMessage(content, activeAgent);
      const assistantMsg = data.message || {
        role: 'assistant',
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setMessagesMap((prev) => ({
        ...prev,
        [activeAgent]: [...(prev[activeAgent] || []), assistantMsg],
      }));

      // Check if the response explicitly delegates (matches "Vou acionar o X" phrasing from Maestro's prompt)
      const delegationPatterns = {
        planner: /vou acionar o stratego/i,
        blog_writer: /vou acionar o scribe/i,
        designer: /vou acionar o pixel/i,
      };

      // If Maestro delegates, actually send the task to that agent
      if (activeAgent === 'orchestrator' && data.content) {
        for (const [agentKey, pattern] of Object.entries(delegationPatterns)) {
          if (pattern.test(data.content)) {
            // Fire and forget — send the user's message to the delegated agent
            (async () => {
              try {
                const delegatedData = await sendChatMessage(
                  content,
                  agentKey
                );
                const delegatedMsg = delegatedData.message || {
                  role: 'assistant',
                  content: delegatedData.content,
                  created_at: new Date().toISOString(),
                };
                // Store the delegated agent's response in their chat
                setMessagesMap((prev) => ({
                  ...prev,
                  [agentKey]: [
                    ...(prev[agentKey] || []),
                    { role: 'user', content, created_at: new Date().toISOString() },
                    delegatedMsg,
                  ],
                }));
                // Show notification badge
                setUnreadCounts((prev) => ({
                  ...prev,
                  [agentKey]: (prev[agentKey] || 0) + 1,
                }));
              } catch (e) {
                console.warn(`Delegation to ${agentKey} failed:`, e.message);
              }
            })();
          }
        }
      }
    } catch (err) {
      setError('Falha ao enviar. Tente novamente.');
      setMessagesMap((prev) => ({
        ...prev,
        [activeAgent]: (prev[activeAgent] || []).filter((m) => m !== userMsg),
      }));
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Total unread for the toggle badge
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className={`guild-chat-container ${isOpen ? 'open' : ''}`} id="guild-chat">
      {/* Chat Panel (expanded) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="guild-chat-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 380, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Chat header showing active agent */}
            <div className="chat-agent-header" style={{ borderBottomColor: agentMeta.color + '33' }}>
              <div className="chat-agent-header-avatar" style={{ background: agentMeta.color + '22' }}>
                <PixelIcon name={agentMeta.icon} size={16} />
              </div>
              <span className="chat-agent-header-name" style={{ color: agentMeta.color }}>
                {agentMeta.name}
              </span>
              <span className="chat-agent-header-tag">online</span>
              <button
                className="chat-clear-btn"
                title="Limpar conversa"
                onClick={async () => {
                  if (!confirm(`Limpar toda a conversa com ${agentMeta.name}?`)) return;
                  try {
                    await clearChatMessages(activeAgent);
                    setMessagesMap((prev) => ({ ...prev, [activeAgent]: [] }));
                    setError(null);
                  } catch {
                    setError('Falha ao limpar conversa.');
                  }
                }}
              >
                <PixelIcon name="power-off" size={14} />
              </button>
            </div>

            <div className="guild-chat-messages">
              {messages.length === 0 && !error && (
                <div className="chat-empty-state">
                  <PixelIcon name={agentMeta.icon} size={32} />
                  <p>{agentMeta.name} aguardando ordens, Comandante.</p>
                  <span>Diga ao {agentMeta.name} o que fazer.</span>
                </div>
              )}
              {error && (
                <div className="chat-error-badge">
                  <PixelIcon name="alert" size={14} />
                  {error}
                </div>
              )}
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} msg={msg} isUser={msg.role === 'user'} agentMeta={agentMeta} />
              ))}
              {isSending && (
                <div className="chat-bubble chat-bubble-assistant">
                  <div className="chat-bubble-avatar" style={{ background: agentMeta.color + '22' }}>
                    <PixelIcon name={agentMeta.icon} size={16} />
                  </div>
                  <div className="chat-bubble-content">
                    <span className="chat-bubble-name" style={{ color: agentMeta.color }}>{agentMeta.name}</span>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Bar (always visible) */}
      <div className="guild-chat-bar">
        <button
          className="chat-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Minimizar chat' : 'Abrir chat'}
          style={{ background: agentMeta.color + '25', borderColor: agentMeta.color + '40' }}
        >
          <PixelIcon name={isOpen ? 'chevron-down' : 'message'} size={18} />
          {!isOpen && totalUnread > 0 && (
            <span className="chat-unread-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
          )}
        </button>

        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={`> Fale com o ${agentMeta.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            id="chat-input-field"
          />
        </div>

        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          title="Enviar"
          id="chat-send-button"
        >
          <PixelIcon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
