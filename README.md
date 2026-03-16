# 👾 IndieSquad: The Agentic Revolution

---

## 📋 Links Importantes (Apresentação)

- 🎥 **Vídeo de Pitch (Até 3 min)**: https://www.youtube.com/watch?v=R46vrsSqoZw&feature=youtu.be
- 🎬 **Vídeo de Demonstração (Até 2 min)**: https://youtu.be/XKdO-AL7Aug?si=oz4R2CHNcbyQLWym
- 📊 **Apresentação (Slide Deck)**: https://www.canva.com/design/DAHECeUca1Q/zuse31HjOibSSZ637m722g/edit?utm_content=DAHECeUca1Q&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton
- 💻 **Repositórios GitHub**: https://github.com/gbborins/IndieSquad 


---

## 🚀 Sobre o Projeto

**IndieSquad** é uma plataforma de gestão e visualização de agentes de IA com uma estética *Cyberpunk/Pixel-Art*. O sistema permite que desenvolvedores e entusiastas de IA monitorem, gerenciem e interajam com "squads" de agentes inteligentes em um ambiente gamificado.

> [!IMPORTANT]
> Este projeto utiliza uma arquitetura híbrida de **React (Vite)** para a interface rica e **PHP (Backend)** para orquestração de APIs e lógica de integração com Supabase.

---

## ✨ Funcionalidades Principais

### 🏢 Guilda (Escritório Virtual)
Uma visualização interativa em pixel-art onde você pode ver seus agentes em tempo real. Cada agente possui animações e estados baseados em suas tarefas atuais.

### 🧠 Sistema de Memória (Long-term Memory)
Os agentes não apenas executam tarefas; eles aprendem. O sistema armazena logs de trabalho e "memórias" que podem ser consultadas para auditoria e melhoria contínua.

### 👤 Gestão de Squad
- **NPCs & Agents**: Interface dedicada para configurar personalidades e objetivos.
- **Quests**: Sistema de tarefas dinâmico.
- **Analytics**: Monitoramento de uso e tokens em tempo real.

---

## 🛠️ Tech Stack

- **Frontend**:
  - `React 19` + `Vite` (HMR ultra-rápido)
  - `Framer Motion` (Animações fluidas e transições de página)
  - `React Router v7`
  - `@supabase/supabase-js` (Auth e Database)
- **Backend**:
  - `PHP 8.x`
  - `Guzzle` (Client HTTP para comunicações intensivas com IA)
  - `vlucas/phpdotenv` (Gestão segura de variáveis de ambiente)
- **Database & Auth**:
  - `Supabase` (Storage, Auth e Real-time database / PostgreSQL)

---

## 🏗️ Estrutura do Repositório

```bash
├── 📁 backend          # Core logic, orquestração de IA e migrations
│   ├── 📁 src/Agents   # Lógica específica dos personagens
│   └── 📁 src/Services # Integrações com APIs externas
├── 📁 frontend         # Interface do usuário (Dashboard e Guilda)
│   ├── 📁 src/pages    # Paginação (Home, Guilda, Memória, etc)
│   └── 📁 src/api      # Clients para comunicação com o backend
└── 📄 schema_dump.json  # Estrutura do banco de dados para replicação
```

---

## 👥 Membros da Equipe

- **Gabriel Borghi Bortolin**  - [https://github.com/gbborins|https://www.linkedin.com/gabriel-borghi-bortolin-27b77b337/]
- **Wendel Santos Silva** - [https://www.linkedin.com/in/wendel-santos-silv|https://github.com/wendeljj]
- **Gabriel Sacilottoo** - [https://www.linkedin.com/in/gabriel-sacilotto-819343365|https://github.com/gabriel-sacilottoo]
- **Luiz Carlos Fernandes Neto**  - [https://www.linkedin.com/in/luiz-carlos-fernandes-neto-740b212a6|https://github.com/gulosospizza2]
---

## ⚡ Instruções de Configuração e Uso (Setup)

### Pré-requisitos
- **Node.js** (v18+)
- **PHP** (8.1+)
- **Composer** (Gerenciador de dependências PHP)
- **Servidor Local** (XAMPP recomendado para ambiente Windows ou CLI nativa do PHP)
- **Conta no Supabase** (para provisionar Banco de Dados e Autenticação)

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/IndieSquad.git
   cd IndieSquad
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   ```

3. **Backend**:
   ```bash
   cd ../backend
   composer install
   ```

### Configuração

Crie um arquivo `.env` tanto no diretório `/frontend` quanto no `/backend` (baseando-se nos exemplos ou usando suas credenciais do **Supabase**).

**Exemplo de `.env` no Frontend:**
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

**Exemplo de `.env` no Backend:**
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_service_role_key_do_supabase
```

### Banco de Dados
Para configurar a estrutura do banco de dados no Supabase, abra a aba "SQL Editor" na dashboard do Supabase e execute os scripts de criação localizados em `schema_dump.json` / `supabase_schema.json` presentes na raiz do projeto.

### Uso (Rodando a aplicação)

1. **Iniciar o Frontend**:
   A partir da pasta `frontend`, execute:
   ```bash
   npm run dev
   ```
   *Acesse `http://localhost:5173` no navegador.*

2. **Iniciar o Backend**:
   A partir da pasta `backend`, execute:
   ```bash
   php -S localhost:8000 -t public
   ```
   *A API estará rodando em `http://localhost:8000`.*

---

## 🎨 Identidade Visual

O projeto segue um design **Neo-Cyberpunk**:
- **Cores**: Pink Neon (`#FF0055`), Cyan (`#00F4FF`), Yellow (`#FFE600`).
- **Typography**: Montserrat (Bold & Italic).
- **Effects**: Glassmorphism, Sombras brutas e animações de skew.

---

## 📄 Licença (Open Source)

Este projeto está licenciado sob a **MIT License**. Sinta-se à vontade para utilizar, modificar e distribuir o código. Consulte o arquivo `LICENSE` no repositório (caso exista) para obter mais detalhes.
