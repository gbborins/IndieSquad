export default function TaskApprovalCard({ task, onApprove }) {
  if (task.status !== "pending_approval") return null;

  return (
    <>
      <h3>[ QUALITY GATE ] - Aguardando Aprovação Humana</h3>
      <p><strong>Tarefa:</strong> {task.title}</p>
      
      <h4>PLANO DO ORQUESTRADOR</h4>
      <pre>
        {JSON.stringify(task.agent_plan, null, 2)}
      </pre>

      <button onClick={() => onApprove(task.id)} style={{marginTop: 16}}>
        [ APROVAR EXECUÇÃO ]
      </button>
    </>
  );
}