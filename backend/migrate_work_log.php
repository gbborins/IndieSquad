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

// Usar o endpoint RPC para rodar SQL
$rpcClient = new GuzzleHttp\Client([
    'headers' => [
        'apikey' => $apiKey,
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
    ]
]);

try {
    $rpcClient->post($supabaseUrl . '/rest/v1/rpc/exec_sql', [
        'json' => [
            'query' => "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_log jsonb DEFAULT '[]'::jsonb;"
        ]
    ]);
    echo "workflow_log column added via RPC.\n";
} catch (\Exception $e) {
    echo "RPC failed (normal if exec_sql function doesn't exist): " . $e->getMessage() . "\n";
    echo "\n>>> IMPORTANT: Please run this SQL in the Supabase Dashboard SQL Editor: <<<\n";
    echo "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_log jsonb DEFAULT '[]'::jsonb;\n";
}
