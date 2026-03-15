import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchChatMessages, sendChatMessage } from '../../api/chat';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

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

function ChatBubble({ msg, isUser }) {
  return (
    <motion.div
      className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {!isUser && (
        <div className="chat-bubble-avatar">
          <PixelIcon name="gamepad" size={16} />
        </div>
      )}
      <div className="chat-bubble-content">
        {!isUser && <span className="chat-bubble-name">Maestro</span>}
        <p className="chat-bubble-text">{msg.content}</p>
        <span className="chat-bubble-time">
          {msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>
    </motion.div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Carrega histórico ao abrir
  useEffect(() => {
    if (!isOpen) return;
    fetchChatMessages()
      .then((data) => {
        setMessages(data.messages || []);
        setError(null);
      })
      .catch(() => setError('Sem conexão com o servidor'))
      .finally(() => setTimeout(scrollToBottom, 100));
  }, [isOpen, scrollToBottom]);

  // Auto-scroll ao receber novas mensagens
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Foca no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    // Optimistic: adiciona a mensagem do user imediatamente
    const userMsg = { role: 'user', content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const data = await sendChatMessage(content);
      // Adiciona a resposta do assistente
      const assistantMsg = data.message || {
        role: 'assistant',
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError('Falha ao enviar. Tente novamente.');
      // Remove a mensagem optimistic se deu erro
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setInput(content); // Restaura o input
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

  const unreadCount = 0; // futuro: contar mensagens não lidas

  return (
    <div className={`guild-chat-container ${isOpen ? 'open' : ''}`} id="guild-chat">
      {/* Chat Panel (expandido) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="guild-chat-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 380, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="guild-chat-messages">
              {messages.length === 0 && !error && (
                <div className="chat-empty-state">
                  <PixelIcon name="gamepad" size={32} />
                  <p>Maestro aguardando ordens, Comandante.</p>
                  <span>Diga ao esquadrão o que fazer.</span>
                </div>
              )}
              {error && (
                <div className="chat-error-badge">
                  <PixelIcon name="alert" size={14} />
                  {error}
                </div>
              )}
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} msg={msg} isUser={msg.role === 'user'} />
              ))}
              {isSending && (
                <div className="chat-bubble chat-bubble-assistant">
                  <div className="chat-bubble-avatar">
                    <PixelIcon name="gamepad" size={16} />
                  </div>
                  <div className="chat-bubble-content">
                    <span className="chat-bubble-name">Maestro</span>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Bar (sempre visível) */}
      <div className="guild-chat-bar">
        <button
          className="chat-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Minimizar chat' : 'Abrir chat'}
        >
          <PixelIcon name={isOpen ? 'chevron-down' : 'message'} size={18} />
          {!isOpen && unreadCount > 0 && (
            <span className="chat-unread-badge">{unreadCount}</span>
          )}
        </button>

        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="> Fale com o Maestro..."
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
