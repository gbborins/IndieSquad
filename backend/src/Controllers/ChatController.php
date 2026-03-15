<?php

namespace App\Controllers;

use App\Services\SupabaseService;
use App\Services\OpenRouterService;
use App\Utils\JsonResponse;

class ChatController
{
    private SupabaseService $supabase;
    private OpenRouterService $llm;

    private const AGENT_PROMPTS = [
        'orchestrator' => [
            'name' => 'Maestro',
            'prompt' => "Você é o Maestro, o Orquestrador (Mission Control) do Indie Squad — uma plataforma de marketing para estúdios indie de games.\nVocê lidera um esquadrão de agentes de IA: Stratego (Planejador), Scribe (Escritor), e Pixel (Designer).\nResponda de forma direta, tática e com personalidade. Use linguagem concisa, quase militar, mas amigável.\nIMPORTANTE: Você é o ponto de contato direto do usuário. Converse normalmente, responda perguntas, dê conselhos e ajude diretamente. NÃO mencione delegar tarefas ou acionar outros agentes a menos que o usuário peça EXPLICITAMENTE para criar um conteúdo específico (ex: 'escreva um blog post', 'crie arte para Steam', 'faça um plano de marketing').\nQuando for realmente necessário delegar uma tarefa de criação de conteúdo, use EXATAMENTE a frase 'Vou acionar o [Nome do agente]' seguida da descrição da tarefa.\nNÃO mencione os nomes dos outros agentes em conversas casuais.\nResponda sempre em português brasileiro.\nMantenha as respostas curtas (máximo 3 parágrafos) a menos que peçam detalhes.",
        ],
        'planner' => [
            'name' => 'Stratego',
            'prompt' => "Você é o Stratego, o Planejador Estratégico do Indie Squad — uma plataforma de marketing para estúdios indie de games.\nSua especialidade é criar planos de marketing, definir estratégias de SEO, posicionamento de marca e calendários de conteúdo.\nVocê é analítico, metódico e adora dados. Fala como um estrategista inteligente mas acessível.\nResponda sempre em português brasileiro.\nMantenha as respostas curtas e objetivas (máximo 3 parágrafos) a menos que peçam detalhes.",
        ],
        'blog_writer' => [
            'name' => 'Scribe',
            'prompt' => "Você é o Scribe, o Escritor do Indie Squad — uma plataforma de marketing para estúdios indie de games.\nSua especialidade é redigir textos finais: blog posts, descrições de jogos, comunicados de imprensa e copy para redes sociais.\nVocê é criativo, eloquente e sabe adaptar o tom para diferentes públicos. Fala com entusiasmo sobre games.\nResponda sempre em português brasileiro.\nMantenha as respostas curtas e objetivas (máximo 3 parágrafos) a menos que peçam detalhes.",
        ],
        'designer' => [
            'name' => 'Pixel',
            'prompt' => "Você é o Pixel, o Designer do Indie Squad — uma plataforma de marketing para estúdios indie de games.\nSua especialidade é gerar assets visuais, dar direção de arte, sugerir paletas de cores e layouts.\nVocê é visual, criativo e fala usando analogias visuais. Pensa em termos de composição, cores e impacto visual.\nResponda sempre em português brasileiro.\nMantenha as respostas curtas e objetivas (máximo 3 parágrafos) a menos que peçam detalhes.",
        ],
    ];

    public function __construct()
    {
        $this->supabase = new SupabaseService();
        $this->llm = new OpenRouterService();
    }

    /**
     * GET /chat/messages?agent=orchestrator — Lista o histórico do chat do usuário para um agente
     */
    public function getMessages(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $agentName = $_GET['agent'] ?? null;

        $messages = $this->supabase->listChatMessages($userId, 50, $agentName);

        JsonResponse::send(['messages' => $messages]);
    }

    /**
     * POST /chat/messages — Recebe mensagem do usuário, envia ao agente especificado, retorna resposta
     */
    public function sendMessage(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['content'])) {
            JsonResponse::send(['error' => 'content é obrigatório'], 422);
            return;
        }

        $userContent = trim($input['content']);
        $agentName = $input['agent'] ?? 'orchestrator';

        // Validate agent name
        if (!isset(self::AGENT_PROMPTS[$agentName])) {
            JsonResponse::send(['error' => 'Agente inválido'], 422);
            return;
        }

        $agentConfig = self::AGENT_PROMPTS[$agentName];

        // 1. Persiste a mensagem do usuário
        $this->supabase->createChatMessage([
            'user_id' => $userId,
            'role' => 'user',
            'content' => $userContent,
            'agent_name' => $agentName,
        ]);

        // 2. Busca as últimas mensagens como contexto (filtradas por agente)
        $history = $this->supabase->listChatMessages($userId, 20, $agentName);

        // 3. Monta o array de mensagens para o LLM
        $llmMessages = [
            [
                'role' => 'system',
                'content' => $agentConfig['prompt'],
            ]
        ];

        // Adiciona histórico recente como contexto
        foreach ($history as $msg) {
            $llmMessages[] = [
                'role' => $msg['role'] === 'user' ? 'user' : 'assistant',
                'content' => $msg['content'],
            ];
        }

        // 4. Chama o OpenRouter
        try {
            $data = $this->llm->chat($llmMessages, [
                'temperature' => 0.6,
            ]);

            $assistantContent = $data['choices'][0]['message']['content'] ?? 'Erro: sem resposta do modelo.';

            // 5. Loga os tokens gastos
            if (isset($data['usage'])) {
                $this->supabase->logTokenUsage(
                    'chat',
                    $agentName,
                    $data['usage']['prompt_tokens'] ?? 0,
                    $data['usage']['completion_tokens'] ?? 0
                );
            }
        } catch (\Exception $e) {
            $assistantContent = $agentConfig['name'] . ' offline no momento. Tente novamente em instantes. (Erro: ' . $e->getMessage() . ')';
        }

        // 6. Persiste a resposta do assistente
        $saved = $this->supabase->createChatMessage([
            'user_id' => $userId,
            'role' => 'assistant',
            'content' => $assistantContent,
            'agent_name' => $agentName,
        ]);

        JsonResponse::send([
            'message' => $saved,
            'content' => $assistantContent,
        ], 201);
    }

    /**
     * DELETE /chat/messages?agent=orchestrator — Limpa o histórico do chat de um agente
     */
    public function clearMessages(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $agentName = $_GET['agent'] ?? null;

        $this->supabase->deleteChatMessages($userId, $agentName);

        JsonResponse::send(['success' => true]);
    }

    private function getAuthenticatedUserId(): string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payloadEncoded = str_replace(['-', '_'], ['+', '/'], $parts[1]);
                $payload = json_decode(base64_decode($payloadEncoded), true);
                if (isset($payload['sub'])) {
                    return $payload['sub'];
                }
            }
        }

        JsonResponse::send(['error' => 'Não autorizado.'], 401);
        exit;
    }
}
