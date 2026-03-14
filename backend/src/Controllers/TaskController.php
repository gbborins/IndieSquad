<?php

namespace App\Controllers;

use App\Services\SupabaseService;
use App\Services\OpenClawService;
use App\Utils\JsonResponse;

class TaskController
{
    private SupabaseService $supabase;
    private OpenClawService $openClaw;

    public function __construct()
    {
        $this->supabase = new SupabaseService();
        $this->openClaw = new OpenClawService();
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

        $task = $this->supabase->createTask([
            'title' => $input['title'],
            'description' => $input['description'],
            'customer_name' => $input['customer_name'] ?? null,
            'status' => 'draft'
        ]);

        $plan = $this->openClaw->generatePlan($task);

        $updatedTask = $this->supabase->updateTask($task['id'], [
            'status' => 'pending_approval',
            'agent_plan' => $plan
        ]);

        JsonResponse::send(['task' => $updatedTask], 201);
    }

    public function approveTask(string $id): void
    {
        $task = $this->supabase->getTask($id);

        if (!$task) {
            JsonResponse::send(['error' => 'Tarefa não encontrada'], 404);
        }

        if (($task['status'] ?? null) !== 'pending_approval') {
            JsonResponse::send(['error' => 'Tarefa não está aguardando aprovação'], 409);
        }

        $approvedTask = $this->supabase->updateTask($id, [
            'status' => 'approved'
        ]);

        $execution = $this->openClaw->executeApprovedTask($approvedTask);

        $runningTask = $this->supabase->updateTask($id, [
            'status' => 'running',
            'execution_id' => $execution['execution_id'] ?? null,
            'agent_response' => $execution
        ]);

        JsonResponse::send(['task' => $runningTask], 200);
    }

    public function listTasks(): void
    {
        $tasks = $this->supabase->listTasks();
        JsonResponse::send(['tasks' => $tasks]);
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
