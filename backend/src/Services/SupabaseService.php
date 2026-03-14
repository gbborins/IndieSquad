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

    public function createTask(array $data): array
    {
        // Pega o workspace_id (Seed padrão)
        $wsRes = $this->client->get('workspaces?select=id&limit=1');
        $wsData = json_decode($wsRes->getBody()->getContents(), true);
        $workspaceId = $wsData[0]['id'] ?? null;

        // Pega o created_by (Seed padrão)
        $profRes = $this->client->get('profiles?select=id&limit=1');
        $profData = json_decode($profRes->getBody()->getContents(), true);
        $profileId = $profData[0]['id'] ?? null;

        if ($workspaceId) $data['workspace_id'] = $workspaceId;
        if ($profileId) $data['created_by'] = $profileId;
        
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

    public function getTask(string $id): ?array
    {
        $response = $this->client->get("tasks?id=eq.$id&select=*");
        $rows = json_decode($response->getBody()->getContents(), true);
        return $rows[0] ?? null;
    }

    public function listTasks(): array
    {
        $response = $this->client->get("tasks?select=*&order=created_at.desc");
        return json_decode($response->getBody()->getContents(), true);
    }
}
