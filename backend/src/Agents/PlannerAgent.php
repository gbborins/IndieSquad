<?php

namespace App\Agents;

class PlannerAgent extends BaseAgent
{
    public function getName(): string
    {
        return 'planner';
    }

    public function execute(array $task): array
    {
        $orchestratorPlan = $task['agent_plan'] ?? $task['_chain_output'] ?? [];

        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é o Planejador Estratégico de marketing de um estúdio Indie de games. Analise o plano do Orquestrador e crie uma estratégia de conteúdo detalhada. Responda SOMENTE em JSON.'
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'instruction' => 'Analise o game pitch e o plano do Orquestrador. Defina: público-alvo, tom de voz, palavras-chave SEO, e estrutura do conteúdo. Retorne JSON com: target_audience, tone_of_voice, seo_keywords (array), content_structure (array de seções), strategy_summary.',
                    'task' => [
                        'title' => $task['title'] ?? '',
                        'description' => $task['description'] ?? '',
                        'customer_name' => $task['customer_name'] ?? null,
                    ],
                    'orchestrator_plan' => $orchestratorPlan
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ]
        ];

        $data = $this->llm->chat($messages, [
            'temperature' => 0.3,
        ]);

        $content = $data['choices'][0]['message']['content'] ?? '{}';
        $decoded = $this->parseJsonResponse($content);

        // Passa os tokens de uso para que o AgentManager possa logar
        if (isset($data['usage'])) {
            $decoded['_usage'] = $data['usage'];
        }

        return $decoded;
    }
}
