import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export async function createTask(payload) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: await getAuthHeaders(),
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
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao aprovar tarefa");
  }

  return response.json();
}

export async function listTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao listar tarefas");
  }

  return response.json();
}