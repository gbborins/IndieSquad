<?php

namespace App\Agents;

class DesignerAgent extends BaseAgent
{
    public function getName(): string
    {
        return 'designer';
    }

    public function execute(array $task): array
    {
        $planData = $task['agent_plan'] ?? $task['_chain_output'] ?? [];

        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é o Designer Visual (Nano Banana 2) de um estúdio Indie de games. Sua especialidade é criar prompts de imagem para banners de Steam, thumbnails de YouTube, e assets de redes sociais que mantenham a consistência do branding do jogo. Responda SOMENTE em JSON.'
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'instruction' => 'Baseado no plano aprovado e no contexto da tarefa, gere os assets visuais necessários. Retorne JSON com: execution_summary (resumo do que foi criado), deliverables (array de objetos com type, description, image_prompt, dimensions, style_notes), art_direction (direção artística geral), status.',
                    'task' => [
                        'title' => $task['title'] ?? '',
                        'description' => $task['description'] ?? '',
                        'customer_name' => $task['customer_name'] ?? null,
                    ],
                    'approved_plan' => $planData,
                    'guidelines' => [
                        'Mantenha o branding do jogo consistente',
                        'Use estilo pixel art ou stylized quando apropriado para jogos indie',
                        'Gere prompts detalhados o suficiente para Midjourney/DALL-E/FAL AI',
                        'Inclua dimensões adequadas por plataforma (Steam: 460x215, YouTube: 1280x720, Instagram: 1080x1080)',
                    ]
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ]
        ];

        $data = $this->llm->chat($messages, [
            'temperature' => 0.6, // Mais criativo para design
        ]);

        $content = $data['choices'][0]['message']['content'] ?? '{}';
        $decoded = $this->parseJsonResponse($content);

        $decoded['execution_id'] = $decoded['execution_id'] ?? uniqid('design_', true);

        if (isset($data['usage'])) {
            $decoded['_usage'] = $data['usage'];
        }

        return $decoded;
    }
}
