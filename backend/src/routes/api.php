<?php

require_once __DIR__ . '/../controllers/UsuarioController.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$basePath = '/';
$rota = str_replace($basePath, '/', $uri);

$controller = new UsuarioController();

if ($rota === '/usuarios' && $method === 'GET') {
    $controller->index();
    exit();
}

if ($rota === '/usuarios' && $method === 'POST') {
    $controller->store();
    exit();
}

http_response_code(404);
echo json_encode([
    "erro" => "Rota não encontrada"
]);
