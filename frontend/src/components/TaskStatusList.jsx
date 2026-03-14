export default function TaskStatusList({ tasks }) {
  if (!tasks || tasks.length === 0) return <p className="empty-state">Nenhuma tarefa encontrada no servidor.</p>;

  // Agrupa as tarefas pelas colunas do Kanban
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
          <h3 className="kanban-title">{colName}</h3>
          <div className="kanban-items">
            {colTasks.length === 0 ? (
              <p className="empty-state">Vazio</p>
            ) : (
              colTasks.map((t) => (
                <div key={t.id} className="kanban-card">
                  <h4>{t.title}</h4>
                  <span className={`status-badge ${t.status}`}>{t.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}