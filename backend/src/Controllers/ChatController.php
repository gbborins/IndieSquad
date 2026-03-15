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
        'orchestrator' => 'Você é o Maestro, o orquestrador de um estúdio indie. Você lidera a equipe e cria planos táticos. Quando o usuário pedir algo que outro agente deveria fazer, diga "Vou acionar o Stratego" ou "Vou acionar o Scribe" ou "Vou acionar o Pixel" conforme necessário. Seja amigável e direto.',
        'planner' => 'Você é o Stratego, o planejador estratégico. Você define estratégias de SEO, posicionamento de conteúdo e análise de mercado. Seja analítico e preciso.',
        'blog_writer' => 'Você é o Scribe, o redator do estúdio. Você escreve blog posts, copies, documentação e textos criativos. Seja criativo e fluente.',
        'designer' => 'Você é o Pixel, o designer do estúdio. Você gera conceitos visuais, prompts de imagem e direção de arte. Seja visual e criativo.',
    ];

    public function __construct()
    {
        $this->supabase = new SupabaseService();
        $this->llm = new OpenRouterService();
    }

    /**
     * GET /chat/messages?agent=orchestrator
     */
    public function getMessages(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $agent = $_GET['agent'] ?? 'orchestrator';

        try {
            $messages = $this->supabase->getChatMessages($userId, $agent);
            JsonResponse::send(['messages' => $messages]);
        } catch (\Exception $e) {
            JsonResponse::send(['messages' => [], 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /chat/messages  { content, agent }
     */
    public function sendMessage(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $input = json_decode(file_get_contents('php://input'), true);

        $content = trim($input['content'] ?? '');
        $agent = $input['agent'] ?? 'orchestrator';

        if (empty($content)) {
            JsonResponse::send(['error' => 'Mensagem vazia'], 400);
            return;
        }

        try {
            // 1. Save the user message
            $this->supabase->saveChatMessage($userId, $agent, 'user', $content);

            // 2. Load recent history for context (last 20 messages)
            $history = $this->supabase->getChatMessages($userId, $agent, 20);

            // 3. Build OpenRouter messages array
            $systemPrompt = self::AGENT_PROMPTS[$agent] ?? self::AGENT_PROMPTS['orchestrator'];
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
            ];

            foreach ($history as $msg) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content'],
                ];
            }

            // 4. Call OpenRouter LLM
            $response = $this->llm->chat($messages, ['temperature' => 0.7]);
            $assistantContent = $response['choices'][0]['message']['content'] ?? 'Desculpe, não consegui processar a resposta.';

            // 5. Save assistant response
            $this->supabase->saveChatMessage($userId, $agent, 'assistant', $assistantContent);

            JsonResponse::send([
                'content' => $assistantContent,
                'message' => [
                    'role' => 'assistant',
                    'content' => $assistantContent,
                    'created_at' => date('c'),
                ],
            ]);
        } catch (\Exception $e) {
            JsonResponse::send(['error' => 'Erro ao processar mensagem: ' . $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /chat/messages?agent=orchestrator
     */
    public function clearMessages(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $agent = $_GET['agent'] ?? 'orchestrator';

        try {
            $this->supabase->clearChatMessages($userId, $agent);
            JsonResponse::send(['success' => true]);
        } catch (\Exception $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
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

        JsonResponse::send(['error' => 'Não autorizado. Token inválido ou ausente.'], 401);
        exit;
    }
}
