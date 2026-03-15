<?php

namespace App\Controllers;

use App\Services\SupabaseService;
use App\Services\AgentManager;
use App\Services\OpenRouterService;
use App\Agents\OrchestratorAgent;
use App\Agents\PlannerAgent;
use App\Agents\BlogWriterAgent;
use App\Agents\DesignerAgent;
use App\Utils\JsonResponse;

class AgentStatusController
{
    private SupabaseService $supabase;
    private AgentManager $squad;

    public function __construct()
    {
        $this->supabase = new SupabaseService();
        $openRouter = new OpenRouterService();

        $this->squad = new AgentManager();
        $this->squad->register(new OrchestratorAgent($openRouter));
        $this->squad->register(new PlannerAgent($openRouter));
        $this->squad->register(new BlogWriterAgent($openRouter));
        $this->squad->register(new DesignerAgent($openRouter));
    }

    /**
     * GET /agents/status
     * Retorna o status de todos os agentes baseado nas tasks ativas
     */
    public function getStatus(): void
    {
        $userId = $this->getAuthenticatedUserId();
        $tasks = $this->supabase->listTasks($userId);
        $roster = $this->squad->getSquadRoster();

        // Determina o status de cada agente baseado nas tasks ativas
        $agentStatusMap = [];
        foreach ($roster as $agentName) {
            $agentStatusMap[$agentName] = 'idle';
        }

        // Varre as tasks para encontrar quem está trabalhando
        $recentLog = [];
        foreach ($tasks as $task) {
            $taskStatus = $task['status'] ?? 'done';

            // Se a task está em progresso, marca os agentes executores como typing
            if ($taskStatus === 'in_progress') {
                // Agentes de execução (blog_writer, designer) estão trabalhando
                $agentStatusMap['blog_writer'] = 'in_progress';
                $agentStatusMap['designer'] = 'in_progress';
            }

            // Se a task está em review, significa que orchestrator e planner terminaram
            // mas aguardam aprovação
            if ($taskStatus === 'in_review') {
                $agentStatusMap['orchestrator'] = 'in_review';
                $agentStatusMap['planner'] = 'in_review';
            }

            // Coleta workflow_log das tasks recentes
            if (!empty($task['workflow_log'])) {
                $log = is_string($task['workflow_log'])
                    ? json_decode($task['workflow_log'], true)
                    : $task['workflow_log'];
                if (is_array($log)) {
                    $recentLog = array_merge($recentLog, $log);
                }
            }
        }

        // Monta a resposta com metadados do agente
        $agentMeta = [
            'orchestrator' => ['role' => 'Orchestrator', 'color' => '#ff5555'],
            'planner'      => ['role' => 'Planner',      'color' => '#55aaff'],
            'blog_writer'  => ['role' => 'Writer',       'color' => '#55ff55'],
            'designer'     => ['role' => 'Designer',     'color' => '#ffaa55'],
        ];

        $agents = [];
        foreach ($roster as $name) {
            $meta = $agentMeta[$name] ?? ['role' => 'Agent', 'color' => '#888'];
            $agents[] = [
                'name'   => $name,
                'role'   => $meta['role'],
                'status' => $agentStatusMap[$name] ?? 'idle',
                'color'  => $meta['color'],
            ];
        }

        // Ordena o log recente por timestamp desc, limita a últimas 10 entradas
        usort($recentLog, function ($a, $b) {
            return strcmp($b['timestamp'] ?? '', $a['timestamp'] ?? '');
        });
        $recentLog = array_slice($recentLog, 0, 10);

        JsonResponse::send([
            'agents'     => $agents,
            'recent_log' => $recentLog,
        ]);
    }

    private function getAuthenticatedUserId(): string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payloadEncoded = str_replace(['-', '_'], ['+', '/'], $parts[1]);
                $payload = json_decode(base64_decode($payloadEncoded), true);
                if (isset($payload['sub'])) {
                    return $payload['sub'];
                }
            }
        }

        JsonResponse::send(['error' => 'Não autorizado.'], 401);
        exit;
    }
}
