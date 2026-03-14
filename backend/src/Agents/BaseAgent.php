<?php

namespace App\Agents;

use App\Services\OpenRouterService;

abstract class BaseAgent implements AgentInterface
{
    protected OpenRouterService $llm;

    public function __construct(OpenRouterService $llm)
    {
        $this->llm = $llm;
    }

    /**
     * Método auxiliar para forçar validação JSON no nível do agente
     */
    protected function parseJsonResponse(string $content): array
    {
        // Se a LLM enviar blocos de código markdown, limpa-os
        $content = preg_replace('/^```json\s*/m', '', $content);
        $content = preg_replace('/```$/m', '', $content);
        $content = trim($content);

        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            // Em vez de crashar, retorna um array com erro para o board
            return ['error' => 'Falha ao decodificar JSON do Agente.', 'raw' => $content];
        }

        return $decoded;
    }
}
