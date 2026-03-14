<?php

namespace App\Services;

use App\Config\Env;
use GuzzleHttp\Client;

class OpenClawService
{
    private Client $client;
    private string $agentId;

    public function __construct()
    {
        $baseUrl = rtrim(Env::get('OPENCLAW_BASE_URL'), '/');
        $apiKey = Env::get('OPENCLAW_API_KEY');
        $this->agentId = Env::get('OPENCLAW_AGENT_ID');

        $this->client = new Client([
            'base_uri' => $baseUrl . '/',
            'headers' => [
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json'
            ],
            'timeout' => 30
        ]);
    }

    public function generatePlan(array $task): array
    {
        $payload = [
            'agent_id' => $this->agentId,
            'mode' => 'plan',
            'input' => [
                'title' => $task['title'],
                'description' => $task['description'],
                'customer_name' => $task['customer_name'] ?? null
            ]
        ];

        // Ajuste o endpoint conforme sua instalação
        $response = $this->client->post('api/agents/plan', [
            'json' => $payload
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }

    public function executeApprovedTask(array $task): array
    {
        $payload = [
            'agent_id' => $this->agentId,
            'mode' => 'execute',
            'task_id' => $task['id'],
            'input' => [
                'title' => $task['title'],
                'description' => $task['description'],
                'customer_name' => $task['customer_name'] ?? null,
                'approved' => true,
                'agent_plan' => $task['agent_plan'] ?? null
            ]
        ];

        // Ajuste o endpoint conforme sua instalação
        $response = $this->client->post('api/agents/execute', [
            'json' => $payload
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }
}
