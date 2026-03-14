<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$supabaseUrl = rtrim($_ENV['SUPABASE_URL'], '/');
$apiKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'];

$opts = [
    "http" => [
        "method" => "GET",
        "header" => "apikey: $apiKey\r\n"
    ]
];

$context = stream_context_create($opts);
$response = file_get_contents($supabaseUrl . '/rest/v1/?apikey=' . $apiKey, false, $context);

$data = json_decode($response, true);
$tables = ['profiles', 'workspaces', 'workspace_members', 'tasks'];
$schema = [];

foreach ($tables as $table) {
    if (isset($data['definitions'][$table])) {
        $schema[$table] = $data['definitions'][$table]['properties'];
    }
}

file_put_contents(__DIR__ . '/../schema_dump.json', json_encode($schema, JSON_PRETTY_PRINT));
echo "Schema dumped successfully.\n";
