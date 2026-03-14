const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function createTask(payload) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar tarefa");
  }

  return response.json();
}

export async function approveTask(taskId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao aprovar tarefa");
  }

  return response.json();
}

export async function listTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks`);

  if (!response.ok) {
    throw new Error("Erro ao listar tarefas");
  }

  return response.json();
}