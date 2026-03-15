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

export async function fetchChatMessages() {
  const response = await fetch(`${API_BASE_URL}/chat/messages`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar mensagens do chat");
  }

  return response.json();
}

export async function sendChatMessage(content) {
  const response = await fetch(`${API_BASE_URL}/chat/messages`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem");
  }

  return response.json();
}
