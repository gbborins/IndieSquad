const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

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

const columnIcons = {
  "A Fazer": "library",
  "Em Progresso": "loader",
  "Em Revisão (Humano)": "human-handsup",
  "Concluído": "check",
};

function generateImageUrl(prompt) {
  if (!prompt) return null;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
}

function DeliverableItem({ deliv, idx }) {
  const isObject = typeof deliv === 'object' && deliv !== null;
  const hasImage = isObject && deliv.image_prompt;
  const title = isObject ? (deliv.type || deliv.title || `Item ${idx + 1}`) : null;
  const desc = isObject ? (deliv.description || deliv.content || '') : (typeof deliv === 'string' ? deliv : JSON.stringify(deliv));

  return (
    <li>
      {title && <strong>{title}:</strong>} {desc}
      {hasImage && (
        <div>
          <img
            src={generateImageUrl(deliv.image_prompt)}
            alt={deliv.description || deliv.image_prompt}
            loading="lazy"
            className="task-deliverable-image"
          />
          <p className="task-image-prompt">🎨 {deliv.image_prompt}</p>
        </div>
      )}
    </li>
  );
}

export default function TaskStatusList({ tasks }) {
  if (!tasks || tasks.length === 0) return <p className="empty-state">Nenhuma tarefa encontrada no servidor.</p>;

  const columns = {
    "A Fazer": tasks.filter((t) => t.status === "todo"),
    "Em Progresso": tasks.filter((t) => t.status === "in_progress"),
    "Em Revisão (Humano)": tasks.filter((t) => t.status === "in_review"),
    "Concluído": tasks.filter((t) => t.status !== "todo" && t.status !== "in_progress" && t.status !== "in_review"),
  };

  return (
    <div className="kanban-board">
      {Object.entries(columns).map(([colName, colTasks]) => (
        <div key={colName} className="kanban-col">
          <h3 className="kanban-title">
            <PixelIcon name={columnIcons[colName] || "wallet"} size={18} /> {colName}
          </h3>
          <div className="kanban-items">
            {colTasks.length === 0 ? (
              <p className="empty-state">Vazio</p>
            ) : (
              colTasks.map((t) => (
                <div key={t.id} className="kanban-card">
                  <h4><PixelIcon name="note" size={14} /> {t.title}</h4>
                  <span className={`status-badge ${t.status}`}>{t.status}</span>

                  {t.status === 'done' && t.agent_response && t.agent_response.deliverables && (
                    <div className="task-deliverables">
                      <h5><PixelIcon name="folder" size={12} /> Entregáveis</h5>
                      {Array.isArray(t.agent_response.deliverables) ? (
                        <ul>
                          {t.agent_response.deliverables.map((deliv, idx) => (
                            <DeliverableItem key={idx} deliv={deliv} idx={idx} />
                          ))}
                        </ul>
                      ) : (
                        <p>{typeof t.agent_response.deliverables === 'string' ? t.agent_response.deliverables : "Ver resposta JSON completa..."}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}