// ═══════════════════════════════════════════════════════════
//  SHARED AGENT CONFIG — Single source of truth for all
//  agent definitions, colors, and game-themed avatars.
// ═══════════════════════════════════════════════════════════

/**
 * Theme Mapping:
 *   Maestro  → Undertale  (8-bit red heart)    — Red
 *   Stratego → Hollow Knight (silver stinger)  — Blue
 *   Scribe   → Minecraft (square block)        — Green
 *   Pixel    → FNAF (bear mask)                — Yellow/Gold
 */

export const AGENTS = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Maestro',
    role: 'Orchestrator',
    icon: 'gamepad',
    color: '#cc2222',
    avatar: '❤️',
    desc: 'Orquestra a equipe e cria planos táticos baseados no briefing do usuário.',
    skills: ['Planejamento', 'Distribuição de tarefas', 'Revisão de qualidade'],
    model: 'GPT-4o Mini',
  },
  planner: {
    id: 'planner',
    name: 'Stratego',
    role: 'Planner',
    icon: 'clipboard',
    color: '#4488cc',
    avatar: '🐝',
    desc: 'Define estratégias de SEO, posicionamento de conteúdo e análise de mercado.',
    skills: ['SEO', 'Análise competitiva', 'Estratégia de conteúdo'],
    model: 'GPT-4o Mini',
  },
  blog_writer: {
    id: 'blog_writer',
    name: 'Scribe',
    role: 'Writer',
    icon: 'feather',
    color: '#44aa44',
    avatar: '🟫',
    desc: 'Redige textos finais como blog posts, copies e documentação técnica.',
    skills: ['Redação', 'Copywriting', 'Documentação'],
    model: 'GPT-4o Mini',
  },
  designer: {
    id: 'designer',
    name: 'Pixel',
    role: 'Designer',
    icon: 'image',
    color: '#ddaa22',
    avatar: '🐻',
    desc: 'Gera prompts de imagem e conceitos visuais para assets do projeto.',
    skills: ['Design Visual', 'Concept Art', 'Prompt Engineering'],
    model: 'GPT-4o Mini',
  },
};

/** Ordered array version for lists/grids */
export const AGENTS_LIST = [
  AGENTS.orchestrator,
  AGENTS.planner,
  AGENTS.blog_writer,
  AGENTS.designer,
];

/** Quick lookup for icon name by agent id */
export const AGENT_ICONS = {
  orchestrator: 'gamepad',
  planner: 'clipboard',
  blog_writer: 'feather',
  designer: 'image',
};
