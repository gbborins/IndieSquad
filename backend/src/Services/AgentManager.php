<?php

namespace App\Services;

use App\Agents\AgentInterface;

class AgentManager
{
    /** @var array<string, AgentInterface> */
    private array $agents = [];

    /**
     * Registra um novo agente no Container
     */
    public function register(AgentInterface $agent): void
    {
        $this->agents[$agent->getName()] = $agent;
    }

    /**
     * Roda a tarefa no agente especificado de forma isolada
     */
    public function run(string $agentName, array $task): array
    {
        if (!isset($this->agents[$agentName])) {
            throw new \Exception("Agente '{$agentName}' inativo ou não registrado no Service Container.");
        }

        try {
            return $this->agents[$agentName]->execute($task);
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'error' => "Falha brutal no agente {$agentName}: " . $e->getMessage()
            ];
        }
    }

    /**
     * Retorna lista de agentes ativos no esquadrão
     */
    public function getSquadRoster(): array
    {
        return array_keys($this->agents);
    }

    /**
     * Executa uma cadeia sequencial de agentes, acumulando o workflow_log
     * Cada agente recebe o output do anterior via _chain_output
     */
    public function runChain(array $agentNames, array $task): array
    {
        $workflowLog = $task['workflow_log'] ?? [];
        if (is_string($workflowLog)) {
            $workflowLog = json_decode($workflowLog, true) ?? [];
        }

        $chainOutput = null;
        $lastResult = [];
        $tokenUsage = []; // Acumula os tokens gastos por agente

        foreach ($agentNames as $agentName) {
            if ($chainOutput !== null) {
                $task['_chain_output'] = $chainOutput;
            }

            $result = $this->run($agentName, $task);

            // Acumula o uso de tokens
            if (isset($result['_usage'])) {
                $tokenUsage[] = [
                    'agent' => $agentName,
                    'prompt_tokens' => $result['_usage']['prompt_tokens'] ?? 0,
                    'completion_tokens' => $result['_usage']['completion_tokens'] ?? 0,
                    'total_tokens' => $result['_usage']['total_tokens'] ?? 0,
                    'timestamp' => date('c'),
                ];
                unset($result['_usage']); // Limpa do output final
            }

            $workflowLog[] = [
                'agent' => $agentName,
                'action' => $this->describeAction($agentName),
                'timestamp' => date('c'),
                'status' => isset($result['error']) ? 'failed' : 'success',
                'summary' => $result['summary'] ?? $result['strategy_summary'] ?? $result['execution_summary'] ?? 'Executado',
            ];

            $chainOutput = $result;
            $lastResult = $result;
        }

        $lastResult['workflow_log'] = $workflowLog;
        $lastResult['_token_usage'] = $tokenUsage;
        return $lastResult;
    }

    private function describeAction(string $agentName): string
    {
        return match ($agentName) {
            'orchestrator' => 'Criou o plano tático da missão',
            'planner' => 'Definiu a estratégia de conteúdo e SEO',
            'blog_writer' => 'Redigiu os textos finais',
            'designer' => 'Gerou os assets visuais',
            default => 'Executou tarefa'
        };
    }
}
