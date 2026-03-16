import { useState, useEffect } from 'react';
import { AGENTS } from '../config/agents';
import { listTasks } from '../api/tasks';
import { fetchChatMessages } from '../api/chat';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

const STATIC_SECTIONS = [
  {
    title: 'Instruções do Agente', key: 'agent_instructions', icon: 'a-arrow-up',
    desc: 'Regras e comportamento definidos para cada agente da guilda.',
    items: Object.values(AGENTS).map(a => ({ agent: a.name, content: a.desc })),
  },
  {
    title: 'Contexto do Projeto', key: 'project_context', icon: 'book-open-sharp',
    desc: 'Informações globais que os agentes usam para manter coerência.',
    items: [
      { agent: 'Sistema', content: 'Tema: Indie Game Studio · Stack: React + PHP + Supabase · Estilo: Pixel Art Dark Theme' },
    ],
  },
];

export default function MemoriaPage() {
  const [expanded, setExpanded] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Load tasks from API
  useEffect(() => {
    async function loadTasks() {
      setLoadingTasks(true);
      try {
        const data = await listTasks();
        setTasks(data.tasks || []);
      } catch (err) {
        console.warn('Erro ao carregar tasks para memória:', err.message);
      } finally {
        setLoadingTasks(false);
      }
    }
    loadTasks();
  }, []);

  // Load chat history from all agents
  useEffect(() => {
    async function loadChatHistory() {
      setLoadingChat(true);
      try {
        const allMessages = [];
        for (const agentId of Object.keys(AGENTS)) {
          try {
            const data = await fetchChatMessages(agentId);
            const msgs = data.messages || [];
            msgs.forEach(msg => {
              allMessages.push({
                agent: AGENTS[agentId].name,
                agentId,
                role: msg.role,
                content: msg.content,
                created_at: msg.created_at,
              });
            });
          } catch { /* agent has no messages */ }
        }
        // Sort by date descending
        allMessages.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setChatHistory(allMessages);
      } catch (err) {
        console.warn('Erro ao carregar histórico de chat:', err.message);
      } finally {
        setLoadingChat(false);
      }
    }
    loadChatHistory();
  }, []);

  // Build task history items
  const taskItems = tasks.map(t => ({
    agent: 'Missão',
    content: `[${t.status?.toUpperCase() || 'PENDENTE'}] ${t.title || t.description || 'Sem título'}`,
    timestamp: t.created_at,
  }));

  // Build chat history items (last 50)
  const chatItems = chatHistory.slice(0, 50).map(msg => ({
    agent: msg.role === 'user' ? 'Comandante' : msg.agent,
    content: msg.content?.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content,
    timestamp: msg.created_at,
    isUser: msg.role === 'user',
  }));

  const dynamicSections = [
    {
      title: 'Histórico de Tasks', key: 'task_history', icon: 'archive',
      desc: 'Registro das tarefas anteriores e seus resultados.',
      items: taskItems,
      loading: loadingTasks,
    },
    {
      title: 'Histórico de Conversas', key: 'chat_history', icon: 'message',
      desc: 'Últimas mensagens trocadas com os agentes da guilda.',
      items: chatItems,
      loading: loadingChat,
    },
  ];

  const allSections = [...STATIC_SECTIONS, ...dynamicSections];

  return (
    <div className="page-container">
      <div className="page-header">
        <img src={`${ICON_BASE}/server.svg`} alt="memoria" width={20} height={20}
          style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.5 }} />
        <span>Memória</span>
      </div>
      <p className="page-description">Base de conhecimento compartilhada entre os agentes da guilda.</p>

      <div className="memory-sections">
        {allSections.map((sec) => (
          <div key={sec.key} className={`memory-card ${expanded === sec.key ? 'expanded' : ''}`}
            onClick={() => setExpanded(expanded === sec.key ? null : sec.key)}>
            <div className="memory-card-header">
              <img src={`${ICON_BASE}/${sec.icon}.svg`} alt={sec.icon} width={18} height={18}
                style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.6 }} />
              <span className="memory-card-title">{sec.title}</span>
              <span className="memory-card-count">
                {sec.loading ? '...' : `${sec.items.length} itens`}
              </span>
            </div>
            <p className="memory-card-desc">{sec.desc}</p>
            {expanded === sec.key && (
              <div className="memory-items" onClick={(e) => e.stopPropagation()}>
                {sec.loading ? (
                  <p className="memory-empty">Carregando...</p>
                ) : sec.items.length === 0 ? (
                  <p className="memory-empty">Nenhum registro salvo ainda.</p>
                ) : sec.items.map((item, i) => (
                  <div key={i} className={`memory-item ${item.isUser ? 'memory-item-user' : ''}`}>
                    <span className="memory-item-agent">{item.agent}</span>
                    <span className="memory-item-content">{item.content}</span>
                    {item.timestamp && (
                      <span className="memory-item-time">
                        {new Date(item.timestamp).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
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
