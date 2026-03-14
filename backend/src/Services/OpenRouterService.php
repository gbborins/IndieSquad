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

    public function chat(array $messages, array $extra = []): array
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
}
