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
}
