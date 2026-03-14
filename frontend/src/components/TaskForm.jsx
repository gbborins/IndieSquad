import { useState } from "react";

export default function TaskForm({ onCreate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    customer_name: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await onCreate(form);
      setForm({
        title: "",
        description: "",
        customer_name: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <h3>[ Novo Ticket ]</h3>
      <input
        required
        placeholder="> Título da tarefa..."
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        required
        rows={4}
        placeholder="> Descreva o que o Esquadrão deve fazer..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <input
        placeholder="> Nome do jogo/cliente (Opcional)"
        value={form.customer_name}
        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
      />

      <button type="submit" disabled={loading}>
        {loading ? "ENVIANDO..." : "DELEGAR AO ESQUADRÃO"}
      </button>
    </form>
  );
}