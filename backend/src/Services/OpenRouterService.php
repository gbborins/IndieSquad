<?php

namespace App\Services;

use App\Config\Env;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class OpenRouterService
{
    private Client $client;
    private string $apiKey;
    private string $model;
    private ?string $siteUrl;
    private ?string $siteName;

    public function __construct()
    {
        $baseUrl = Env::get('OPENROUTER_BASE_URL');
        $apiKey = Env::get('OPENROUTER_API_KEY');
        $model = Env::get('OPENROUTER_MODEL', 'openai/gpt-4o-mini');

        if (!$baseUrl) {
            throw new \Exception('OPENROUTER_BASE_URL não definido no .env');
        }

        if (!$apiKey) {
            throw new \Exception('OPENROUTER_API_KEY não definido no .env');
        }

        $this->apiKey = $apiKey;
        $this->model = $model;
        $this->siteUrl = Env::get('SITE_URL');
        $this->siteName = Env::get('SITE_NAME');

        $this->client = new Client([
            'base_uri' => rtrim($baseUrl, '/') . '/',
            'timeout' => 60,
        ]);
    }

    private function defaultHeaders(): array
    {
        $headers = [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ];

        if ($this->siteUrl) {
            $headers['HTTP-Referer'] = $this->siteUrl;
        }

        if ($this->siteName) {
            $headers['X-OpenRouter-Title'] = $this->siteName;
        }

        return $headers;
    }

    private function chat(array $messages, array $extra = []): array
    {
        $payload = array_merge([
            'model' => $this->model,
            'messages' => $messages,
        ], $extra);

        try {
            $response = $this->client->post('chat/completions', [
                'headers' => $this->defaultHeaders(),
                'json' => $payload,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!is_array($data)) {
                throw new \Exception('Resposta inválida do OpenRouter');
            }

            return $data;
        } catch (GuzzleException $e) {
            throw new \Exception('Erro HTTP OpenRouter: ' . $e->getMessage());
        }
    }

    public function generatePlan(array $task): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é um agente que cria planos de execução para tarefas comerciais e técnicas. Responda somente em JSON válido.'
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'instruction' => 'Crie um plano objetivo para executar a tarefa. Retorne JSON com as chaves summary, steps, estimated_output.',
                    'task' => [
                        'title' => $task['title'] ?? '',
                        'description' => $task['description'] ?? '',
                        'customer_name' => $task['customer_name'] ?? null
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ]
        ];

        $data = $this->chat($messages, [
            'temperature' => 0.3,
        ]);

        $content = $data['choices'][0]['message']['content'] ?? null;

        if (!$content) {
            throw new \Exception('O OpenRouter não retornou conteúdo para generatePlan');
        }

        $decoded = json_decode($content, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        return [
            'summary' => $content,
            'steps' => [],
            'estimated_output' => []
        ];
    }

    public function executeApprovedTask(array $task): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é um agente executor. Execute a tarefa aprovada e responda somente em JSON válido.'
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'instruction' => 'Com base na tarefa e no plano aprovado, gere uma resposta de execução em JSON com as chaves execution_summary, deliverables, next_actions, status.',
                    'task' => [
                        'id' => $task['id'] ?? null,
                        'title' => $task['title'] ?? '',
                        'description' => $task['description'] ?? '',
                        'customer_name' => $task['customer_name'] ?? null,
                        'agent_plan' => $task['agent_plan'] ?? null
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ]
        ];

        $data = $this->chat($messages, [
            'temperature' => 0.4,
        ]);

        $content = $data['choices'][0]['message']['content'] ?? null;

        if (!$content) {
            throw new \Exception('O OpenRouter não retornou conteúdo para executeApprovedTask');
        }

        $decoded = json_decode($content, true);

        if (is_array($decoded)) {
            $decoded['execution_id'] = $decoded['execution_id'] ?? uniqid('exec_', true);
            return $decoded;
        }

        return [
            'execution_id' => uniqid('exec_', true),
            'execution_summary' => $content,
            'deliverables' => [],
            'next_actions' => [],
            'status' => 'running'
        ];
    }
}
