<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Config\Env;
use App\Controllers\TaskController;
use App\Controllers\AgentStatusController;
use App\Utils\Router;
use App\Utils\JsonResponse;

Env::load(dirname(__DIR__));
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router();
$controller = new TaskController();
$agentController = new AgentStatusController();
$router->add('GET', '/tasks', [$controller, 'listTasks']);
$router->add('GET', '/tasks/{id}', [$controller, 'getTask']);
$router->add('POST', '/tasks', [$controller, 'createTask']);
$router->add('POST', '/tasks/{id}/approve', [$controller, 'approveTask']);
$router->add('GET', '/stats/tokens', [$controller, 'getTokenStats']);
$router->add('GET', '/agents/status', [$agentController, 'getStatus']);
try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (\Throwable $e) {
    JsonResponse::send([
        'error' => 'Erro interno',
        'message' => $e->getMessage()
    ], 500);
}
