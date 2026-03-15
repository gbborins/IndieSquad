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

export async function fetchAgentStatus() {
  const response = await fetch(`${API_BASE_URL}/agents/status`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar status dos agentes");
  }

  return response.json();
}
