<?php

namespace App\Services;

use App\Config\Env;
use GuzzleHttp\Client;

class SupabaseService
{
    private Client $client;
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(Env::get('SUPABASE_URL'), '/');
        $key = Env::get('SUPABASE_SERVICE_ROLE_KEY');

        $this->client = new Client([
            'base_uri' => $this->baseUrl . '/rest/v1/',
            'headers' => [
                'apikey' => $key,
                'Authorization' => 'Bearer ' . $key,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation'
            ]
        ]);
    }

    public function createTask(array $data, string $userId): array
    {
        // Pega o workspace_id (Seed padrão)
        $wsRes = $this->client->get('workspaces?select=id&limit=1');
        $wsData = json_decode($wsRes->getBody()->getContents(), true);
        $workspaceId = $wsData[0]['id'] ?? null;

        if ($workspaceId) $data['workspace_id'] = $workspaceId;
        
        // Define o usuário real que criou a tarefa
        $data['created_by'] = $userId;
        
        $response = $this->client->post('tasks', [
            'json' => [$data]
        ]);

        $rows = json_decode($response->getBody()->getContents(), true);
        return $rows[0] ?? [];
    }

    public function updateTask(string $id, array $data): array
    {
        $response = $this->client->patch("tasks?id=eq.$id", [
            'json' => $data
        ]);

        $rows = json_decode($response->getBody()->getContents(), true);
        return $rows[0] ?? [];
    }

    public function getTask(string $id, string $userId): ?array
    {
        $response = $this->client->get("tasks?id=eq.$id&created_by=eq.$userId&select=*");
        $rows = json_decode($response->getBody()->getContents(), true);
        return $rows[0] ?? null;
    }

    public function listTasks(string $userId): array
    {
        $response = $this->client->get("tasks?select=*&created_by=eq.$userId&order=created_at.desc");
        return json_decode($response->getBody()->getContents(), true);
    }

    /**
     * Registra o uso de tokens de um agente
     */
    public function logTokenUsage(string $taskId, string $agentName, int $tokensIn, int $tokensOut, string $model = null): void
    {
        try {
            $this->client->post('token_usage', [
                'json' => [[
                    'task_id' => $taskId,
                    'agent_name' => $agentName,
                    'tokens_in' => $tokensIn,
                    'tokens_out' => $tokensOut,
                    'model' => $model ?? 'openai/gpt-4o-mini'
                ]]
            ]);
        } catch (\Exception $e) {
            // Silencia erros de logging para não quebrar o fluxo principal
            error_log("Token logging failed: " . $e->getMessage());
        }
    }

    /**
     * Retorna as estatísticas de tokens agregadas
     */
    public function getTokenStats(): array
    {
        try {
            $response = $this->client->get("token_usage?select=*&order=created_at.desc");
            $rows = json_decode($response->getBody()->getContents(), true);

            $totalIn = 0;
            $totalOut = 0;
            $byAgent = [];

            foreach ($rows as $row) {
                $totalIn += (int)($row['tokens_in'] ?? 0);
                $totalOut += (int)($row['tokens_out'] ?? 0);

                $agent = $row['agent_name'] ?? 'unknown';
                if (!isset($byAgent[$agent])) {
                    $byAgent[$agent] = ['tokens_in' => 0, 'tokens_out' => 0, 'calls' => 0];
                }
                $byAgent[$agent]['tokens_in'] += (int)($row['tokens_in'] ?? 0);
                $byAgent[$agent]['tokens_out'] += (int)($row['tokens_out'] ?? 0);
                $byAgent[$agent]['calls']++;
            }

            // Estimativa de custo: GPT-4o-mini ~$0.15/1M input, ~$0.60/1M output
            $estimatedCost = ($totalIn * 0.00000015) + ($totalOut * 0.0000006);

            return [
                'total_tokens_in' => $totalIn,
                'total_tokens_out' => $totalOut,
                'total_tokens' => $totalIn + $totalOut,
                'estimated_cost_usd' => round($estimatedCost, 6),
                'by_agent' => $byAgent,
                'total_calls' => count($rows),
            ];
        } catch (\Exception $e) {
            return [
                'total_tokens_in' => 0,
                'total_tokens_out' => 0,
                'total_tokens' => 0,
                'estimated_cost_usd' => 0,
                'by_agent' => [],
                'total_calls' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    // ── Chat Messages ───────────────────────────────────────

    public function getChatMessages(string $userId, string $agent, int $limit = 50): array
    {
        try {
            $response = $this->client->get(
                "chat_messages?user_id=eq.$userId&agent=eq.$agent&select=*&order=created_at.asc&limit=$limit"
            );
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            error_log("getChatMessages failed: " . $e->getMessage());
            return [];
        }
    }

    public function saveChatMessage(string $userId, string $agent, string $role, string $content): void
    {
        try {
            $this->client->post('chat_messages', [
                'json' => [[
                    'user_id' => $userId,
                    'agent' => $agent,
                    'role' => $role,
                    'content' => $content,
                ]]
            ]);
        } catch (\Exception $e) {
            error_log("saveChatMessage failed: " . $e->getMessage());
        }
    }

    public function clearChatMessages(string $userId, string $agent): void
    {
        try {
            $this->client->delete("chat_messages?user_id=eq.$userId&agent=eq.$agent");
        } catch (\Exception $e) {
            error_log("clearChatMessages failed: " . $e->getMessage());
        }
    }

    // ── Storage ─────────────────────────────────────────────

    /**
     * Upload a file to Supabase Storage.
     * Returns the public URL of the uploaded file.
     */
    public function uploadToStorage(string $bucket, string $path, string $fileData, string $contentType = 'image/png'): string
    {
        $key = Env::get('SUPABASE_SERVICE_ROLE_KEY');
        $url = $this->baseUrl . "/storage/v1/object/$bucket/$path";

        $storageClient = new \GuzzleHttp\Client(['timeout' => 30]);

        $response = $storageClient->request('POST', $url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $key,
                'Content-Type' => $contentType,
                'x-upsert' => 'true',
            ],
            'body' => $fileData,
        ]);

        if ($response->getStatusCode() !== 200) {
            throw new \Exception('Supabase Storage upload failed: ' . $response->getStatusCode());
        }

        return $this->getPublicUrl($bucket, $path);
    }

    /**
     * Get a public URL for a file in Supabase Storage.
     */
    public function getPublicUrl(string $bucket, string $path): string
    {
        return $this->baseUrl . "/storage/v1/object/public/$bucket/$path";
    }
}
