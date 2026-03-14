<?php

namespace App\Agents;

class OrchestratorAgent extends BaseAgent
{
    public function getName(): string
    {
        return 'orchestrator';
    }

    public function execute(array $task): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é o Orquestrador (Mission Control) de um estúdio Indie. Crie planos de execução táticos para tarefas comerciais e técnicas. Responda SOMENTE em JSON.'
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'instruction' => 'Crie um plano objetivo para delegar esta tarefa. Retorne JSON com as chaves: summary (resumo da estratégia), steps (passo a passo), estimated_output (o que esperar).',
                    'task' => [
                        'title' => $task['title'] ?? '',
                        'description' => $task['description'] ?? '',
                        'customer_name' => $task['customer_name'] ?? null
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ]
        ];

        // Chama o client HTTP do OpenRouter usando a inteligência do agente
        $data = $this->llm->chat($messages, [
            'temperature' => 0.3,
        ]);

        $content = $data['choices'][0]['message']['content'] ?? '{}';
        
        return $this->parseJsonResponse($content);
    }
}
