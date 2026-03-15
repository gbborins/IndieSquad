<?php

namespace App\Agents;

class BlogWriterAgent extends BaseAgent
{
    public function getName(): string
    {
        return 'blog_writer';
    }

    public function execute(array $task): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é o Redator (Blog Writer) de um estúdio Indie. Execute a tarefa baseada no plano aprovado. Responda SOMENTE em JSON.'
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'instruction' => 'Baseado no plano, escreva os textos finais. Retorne JSON com as chaves: execution_summary, deliverables (array com o texto), next_actions, status.',
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

        // Temperatura um pouco maior para criatividade na escrita
        $data = $this->llm->chat($messages, [
            'temperature' => 0.5,
        ]);

        $content = $data['choices'][0]['message']['content'] ?? '{}';
        $decoded = $this->parseJsonResponse($content);

        $decoded['execution_id'] = $decoded['execution_id'] ?? uniqid('exec_', true);

        if (isset($data['usage'])) {
            $decoded['_usage'] = $data['usage'];
        }

        return $decoded;
    }
}
