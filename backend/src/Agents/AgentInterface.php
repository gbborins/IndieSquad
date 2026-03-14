<?php

namespace App\Agents;

interface AgentInterface
{
    /**
     * Retorna o nome identificador do Agente
     */
    public function getName(): string;

    /**
     * Executa a especialidade do agente baseada na tarefa
     */
    public function execute(array $task): array;
}
