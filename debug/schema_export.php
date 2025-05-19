<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $schema = [];

    foreach ($tables as $table) {
        $columns = $conn->query("DESCRIBE `$table`")->fetchAll();

        $schema[$table] = array_map(function($col) {
            return [
                'Field'   => $col['Field'],
                'Type'    => $col['Type'],
                'Null'    => $col['Null'],
                'Key'     => $col['Key'],
                'Default' => $col['Default'],
                'Extra'   => $col['Extra'],
            ];
        }, $columns);
    }

    echo json_encode([
        'database' => DB_NAME,
        'generated_at' => date('c'),
        'schema' => $schema
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
