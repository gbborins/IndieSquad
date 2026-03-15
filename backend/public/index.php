<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Config\Env;
use App\Controllers\TaskController;
use App\Controllers\AgentStatusController;
use App\Controllers\ChatController;
use App\Utils\Router;
use App\Utils\JsonResponse;

Env::load(dirname(__DIR__));
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router();
$controller = new TaskController();
$agentController = new AgentStatusController();
$chatController = new ChatController();
$router->add('GET', '/tasks', [$controller, 'listTasks']);
$router->add('GET', '/tasks/{id}', [$controller, 'getTask']);
$router->add('POST', '/tasks', [$controller, 'createTask']);
$router->add('POST', '/tasks/{id}/approve', [$controller, 'approveTask']);
$router->add('GET', '/stats/tokens', [$controller, 'getTokenStats']);
$router->add('GET', '/agents/status', [$agentController, 'getStatus']);
$router->add('GET', '/chat/messages', [$chatController, 'getMessages']);
$router->add('POST', '/chat/messages', [$chatController, 'sendMessage']);
$router->add('DELETE', '/chat/messages', [$chatController, 'clearMessages']);
try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (\Throwable $e) {
    JsonResponse::send([
        'error' => 'Erro interno',
        'message' => $e->getMessage()
    ], 500);
}
