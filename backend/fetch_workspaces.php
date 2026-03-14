<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$supabaseUrl = rtrim($_ENV['SUPABASE_URL'], '/');
$apiKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'];

$client = new GuzzleHttp\Client([
    'base_uri' => $supabaseUrl . '/rest/v1/',
    'headers' => [
        'apikey' => $apiKey,
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
        'Prefer' => 'return=representation'
    ]
]);

// Fetch workspaces
$response = $client->get("workspaces?select=*");
$workspaces = json_decode($response->getBody()->getContents(), true);

file_put_contents(__DIR__ . '/../workspaces_dump.json', json_encode($workspaces, JSON_PRETTY_PRINT));
echo "Workspaces dumped.\n";
