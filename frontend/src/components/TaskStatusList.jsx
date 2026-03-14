export default function TaskStatusList({ tasks }) {
  if (!tasks || tasks.length === 0) return <p className="empty-state">Nenhuma tarefa encontrada no servidor.</p>;

  // Agrupa as tarefas pelas colunas do Kanban
  const columns = {
    "A Fazer (Draft)": tasks.filter((t) => t.status === "draft"),
    "Planejando/Executando": tasks.filter((t) => t.status === "running" || t.status === "pending_approval"),
    "Em Revisão (Humano)": tasks.filter((t) => t.status === "pending_approval"), // Simplificando por hora
    "Concluído": tasks.filter((t) => t.status === "completed"),
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