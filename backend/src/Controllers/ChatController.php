<?php

namespace App\Controllers;

use App\Services\SupabaseService;
use App\Services\OpenRouterService;
use App\Utils\JsonResponse;

class ChatController
{
    private SupabaseService $supabase;
    private OpenRouterService $llm;

    public function __construct()
    {
        $this->supabase = new SupabaseService();
        $this->llm = new OpenRouterService();
    }

    /**
     * GET /chat/messages — Lista o histórico do chat do usuário
     */
    public function getMessages(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $messages = $this->supabase->listChatMessages($userId);

        JsonResponse::send(['messages' => $messages]);
    }

    /**
     * POST /chat/messages — Recebe mensagem do usuário, envia ao Orquestrador, retorna resposta
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

        // 1. Persiste a mensagem do usuário
        $this->supabase->createChatMessage([
            'user_id' => $userId,
            'role' => 'user',
            'content' => $userContent,
            'agent_name' => 'orchestrator',
        ]);

        // 2. Busca as últimas mensagens como contexto
        $history = $this->supabase->listChatMessages($userId, 20);

        // 3. Monta o array de mensagens para o LLM
        $llmMessages = [
            [
                'role' => 'system',
                'content' => implode("\n", [
                    'Você é o Maestro, o Orquestrador (Mission Control) do Indie Squad — uma plataforma de marketing para estúdios indie de games.',
                    'Você lidera um esquadrão de agentes de IA: Stratego (Planejador), Scribe (Escritor), e Pixel (Designer).',
                    'Responda de forma direta, tática e com personalidade. Use linguagem concisa, quase militar, mas amigável.',
                    'Se o usuário pedir para criar conteúdo, explique que você delegará ao esquadrão e que eles podem acompanhar no painel de Quests.',
                    'Responda sempre em português brasileiro.',
                    'Mantenha as respostas curtas (máximo 3 parágrafos) a menos que peçam detalhes.',
                ])
            ]
        ];

        // Adiciona histórico recente como contexto
        foreach ($history as $msg) {
            // Pula a mensagem que acabamos de inserir (já é a última do user)
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
                    'orchestrator',
                    $data['usage']['prompt_tokens'] ?? 0,
                    $data['usage']['completion_tokens'] ?? 0
                );
            }
        } catch (\Exception $e) {
            $assistantContent = 'Maestro offline no momento. Tente novamente em instantes. (Erro: ' . $e->getMessage() . ')';
        }

        // 6. Persiste a resposta do assistente
        $saved = $this->supabase->createChatMessage([
            'user_id' => $userId,
            'role' => 'assistant',
            'content' => $assistantContent,
            'agent_name' => 'orchestrator',
        ]);

        JsonResponse::send([
            'message' => $saved,
            'content' => $assistantContent,
        ], 201);
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
