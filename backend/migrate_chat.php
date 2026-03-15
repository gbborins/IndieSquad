<?php
/**
 * Creates the chat_messages table in Supabase via the Management API.
 * Run: php migrate_chat.php
 */

require __DIR__ . '/vendor/autoload.php';

use App\Config\Env;

Env::load(__DIR__);

$url = rtrim(Env::get('SUPABASE_URL'), '/');
$key = Env::get('SUPABASE_SERVICE_ROLE_KEY');

// Use the Supabase REST SQL endpoint (rpc) to create the table
// Since we can't run raw SQL via REST easily, let's use a different approach:
// Create via the REST API by doing an insert that will auto-create if using the admin API,
// OR use the rpc endpoint

// Actually, the simplest approach: use the Supabase REST API to call a raw SQL function
// But Supabase REST doesn't support DDL. We need to use the PostgREST management endpoint.

// The cleanest way: use the Supabase Dashboard SQL editor or use the management API.
// Let's try the SQL endpoint:

$client = new GuzzleHttp\Client();

// Use the Supabase SQL endpoint (available in newer versions)
$sql = "
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent TEXT NOT NULL DEFAULT 'orchestrator',
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_agent ON chat_messages(user_id, agent, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY IF NOT EXISTS chat_messages_service_all ON chat_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);
";

try {
    // Try using the Supabase SQL API (pg endpoint)
    $response = $client->post($url . '/rest/v1/rpc/exec_sql', [
        'headers' => [
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
        ],
        'json' => ['query' => $sql],
    ]);
    echo "Table created via rpc!\n";
    echo $response->getBody()->getContents() . "\n";
} catch (\Exception $e) {
    echo "RPC method failed (expected): " . $e->getMessage() . "\n";
    echo "\n╔════════════════════════════════════════════════════════════╗\n";
    echo "║  Please create the table manually in the Supabase SQL    ║\n";
    echo "║  editor. Go to: https://supabase.com/dashboard          ║\n";
    echo "║  Open your project → SQL Editor → New Query, then run:  ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";
    echo $sql;
}
