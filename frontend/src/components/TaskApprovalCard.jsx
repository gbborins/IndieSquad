export default function TaskApprovalCard({ task, onApprove }) {
  if (task.status !== "pending_approval") return null;

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginTop: 16 }}>
      <h3>Aprovação necessária</h3>
      <p><strong>Tarefa:</strong> {task.title}</p>
      <p><strong>Descrição:</strong> {task.description}</p>

      <h4>Plano do agente</h4>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(task.agent_plan, null, 2)}
      </pre>

      <button onClick={() => onApprove(task.id)}>
        Aprovar execução
      </button>
    </div>
  );
}