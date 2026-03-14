import { useEffect, useState } from "react";
import { createTask, approveTask, listTasks } from "../api/tasks";
import TaskForm from "../components/TaskForm";
import TaskApprovalCard from "../components/TaskApprovalCard";
import TaskStatusList from "../components/TaskStatusList";

export default function Home() {
  const [tasks, setTasks] = useState([]);

  const selectedTask =
    tasks.find((t) => t.status === "pending_approval") || null;

  async function loadTasks() {
    try {
      const data = await listTasks();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  }

  async function handleCreate(payload) {
    try {
      await createTask(payload);
      await loadTasks();
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  }

  async function handleApprove(taskId) {
    try {
      await approveTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error("Erro ao aprovar tarefa:", error);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const fetchTasks = async () => {
      try {
        const data = await listTasks();

        if (!cancelled) {
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      }
    };

    fetchTasks();

    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Site de vendas de serviço de IA</h1>
      <p>Solicite uma tarefa ao agente, revise o plano e aprove a execução.</p>

      <TaskForm onCreate={handleCreate} />

      {selectedTask && (
        <TaskApprovalCard task={selectedTask} onApprove={handleApprove} />
      )}

      <TaskStatusList tasks={tasks} />
    </div>
  );
}