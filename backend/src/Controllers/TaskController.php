<?php

namespace App\Controllers;

use App\Services\SupabaseService;
use App\Services\OpenRouterService;
use App\Services\AgentManager;
use App\Agents\OrchestratorAgent;
use App\Agents\PlannerAgent;
use App\Agents\BlogWriterAgent;
use App\Utils\JsonResponse;

class TaskController
{
    private SupabaseService $supabase;
    private AgentManager $squad;

    public function __construct()
    {
        $this->supabase = new SupabaseService();
        $openRouter = new OpenRouterService();
        
        // Inicializa o Service Container do Esquadrão
        $this->squad = new AgentManager();
        $this->squad->register(new OrchestratorAgent($openRouter));
        $this->squad->register(new PlannerAgent($openRouter));
        $this->squad->register(new BlogWriterAgent($openRouter));
    }

    public function createTask(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (
            empty($input['title']) ||
            empty($input['description'])
        ) {
            JsonResponse::send(['error' => 'title e description são obrigatórios'], 422);
        }

        // 1. Persiste a intenção inicial
        $task = $this->supabase->createTask([
            'title' => $input['title'],
            'description' => $input['description'],
            'customer_name' => $input['customer_name'] ?? null,
            'status' => 'todo',
            'column_id' => 'todo'
        ]);

        // 2. Chama a Cadeia de Agentes: Orquestrador → Planejador
        $chainResult = $this->squad->runChain(['orchestrator', 'planner'], $task);

        // 3. Trava na Aprovação e guarda o plano + workflow_log
        $updatedTask = $this->supabase->updateTask($task['id'], [
            'status' => 'in_review',
            'column_id' => 'in_review',
            'agent_plan' => $chainResult,
            'workflow_log' => json_encode($chainResult['workflow_log'] ?? [])
        ]);

        JsonResponse::send(['task' => $updatedTask], 201);
    }

    public function approveTask(string $id): void
    {
        $task = $this->supabase->getTask($id);

        if (!$task) {
            JsonResponse::send(['error' => 'Tarefa não encontrada'], 404);
        }

        if (($task['status'] ?? null) !== 'in_review') {
            JsonResponse::send(['error' => 'Tarefa não está aguardando aprovação'], 409);
        }

        $approvedTask = $this->supabase->updateTask($id, [
            'status' => 'in_progress', // Status passa a ser Running temporariamente no frontend
            'column_id' => 'in_progress'
        ]);

        // 3. Delega para os Agentes de Execução Especialistas (ex: Blog Writer)
        // Passa o workflow_log existente para o chain continuar acumulando
        $approvedTask['workflow_log'] = $approvedTask['workflow_log'] ?? '[]';
        $execution = $this->squad->runChain(['blog_writer'], $approvedTask);

        $finalStatus = $execution['status'] ?? 'done';

        // 4. Salva a execução final das roles
        $completedTask = $this->supabase->updateTask($id, [
            'status' => $finalStatus,
            'column_id' => $finalStatus,
            'execution_id' => $execution['execution_id'] ?? null,
            'agent_response' => $execution,
            'workflow_log' => json_encode($execution['workflow_log'] ?? [])
        ]);

        JsonResponse::send(['task' => $completedTask], 200);
    }

    public function listTasks(): void
    {
        $tasks = $this->supabase->listTasks();
        $roster = $this->squad->getSquadRoster(); // Extra métrica opcional do Backend
        
        JsonResponse::send([
            'tasks' => $tasks,
            'active_agents' => $roster
        ]);
    }

    public function getTask(string $id): void
    {
        $task = $this->supabase->getTask($id);

        if (!$task) {
            JsonResponse::send(['error' => 'Tarefa não encontrada'], 404);
        }

        JsonResponse::send(['task' => $task]);
    }
}
