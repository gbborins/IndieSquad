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

// 1. Create a Profile
$profileId = '11111111-1111-1111-1111-111111111111';
$client->post('profiles?on_conflict=id', [
    'headers' => ['Prefer' => 'resolution=merge-duplicates,return=representation'],
    'json' => [[
        'id' => $profileId,
        'email' => 'admin@indiesquad.com',
        'full_name' => 'Admin'
    ]]
]);

// 2. Create a Workspace
$response = $client->post('workspaces', [
    'headers' => ['Prefer' => 'return=representation'],
    'json' => [[
        'name' => 'IndieSquad HQ',
        'slug' => 'indiesquad-hq'
    ]]
]);
$workspaces = json_decode($response->getBody()->getContents(), true);
$workspaceId = $workspaces[0]['id'];

// 3. Link them
$client->post('workspace_members', [
    'json' => [[
        'workspace_id' => $workspaceId,
        'user_id' => $profileId,
        'role' => 'owner'
    ]]
]);

echo "Seeded successfully! Workspace ID: " . $workspaceId . "\n";
