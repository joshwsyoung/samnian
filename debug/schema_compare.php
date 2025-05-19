<?php
require_once '../config.php';

// Normalize column definitions
function normalizeColumn($col) {
    return [
        'Type'    => strtolower(trim($col['Type'] ?? '')),
        'Null'    => strtoupper(trim($col['Null'] ?? '')),
        'Key'     => strtoupper(trim($col['Key'] ?? '')),
        'Default' => $col['Default'] === null ? null : (string)$col['Default'],
        'Extra'   => strtolower(trim($col['Extra'] ?? ''))
    ];
}

// Get schema from current DB
function getCurrentSchema($conn) {
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $schema = [];

    foreach ($tables as $table) {
        $columns = $conn->query("DESCRIBE `$table`")->fetchAll();
        $schema[$table] = [];
        foreach ($columns as $col) {
            $schema[$table][$col['Field']] = normalizeColumn($col); // <- Normalize here
        }
    }

    return $schema;
}


// Compare schemas
function compareSchemas($current, $input) {
    $changes = [];

    $inputTables = array_keys($input);
    $currentTables = array_keys($current);

    $addedTables = array_diff($inputTables, $currentTables);
    $removedTables = array_diff($currentTables, $inputTables);
    $sharedTables = array_intersect($inputTables, $currentTables);

    foreach ($addedTables as $t) {
        $changes[] = ['type' => 'table-added', 'table' => $t, 'sql' => "/* Manual creation required for table '$t' */"];
    }

    foreach ($removedTables as $t) {
        $changes[] = ['type' => 'table-removed', 'table' => $t, 'sql' => "DROP TABLE `$t`;"];
    }

    foreach ($sharedTables as $table) {
        $inputCols = $input[$table];
        $currentCols = $current[$table];

        $inputFields = array_keys($inputCols);
        $currentFields = array_keys($currentCols);

        $added = array_diff($inputFields, $currentFields);
        $removed = array_diff($currentFields, $inputFields);
        $common = array_intersect($inputFields, $currentFields);

        foreach ($added as $field) {
            $col = $inputCols[$field];
            $sql = "ALTER TABLE `$table` ADD COLUMN `$field` {$col['Type']} " .
                   ($col['Null'] === 'NO' ? 'NOT NULL' : 'NULL') .
                   (isset($col['Default']) ? " DEFAULT " . ($col['Default'] === null ? "NULL" : "'{$col['Default']}'") : '') .
                   (!empty($col['Extra']) ? " {$col['Extra']}" : '') . ";";
            $changes[] = ['type' => 'column-added', 'table' => $table, 'column' => $field, 'to' => $col, 'sql' => $sql];
        }

        foreach ($removed as $field) {
            $sql = "ALTER TABLE `$table` DROP COLUMN `$field`;";
            $changes[] = ['type' => 'column-removed', 'table' => $table, 'column' => $field, 'sql' => $sql];
        }

        foreach ($common as $field) {
            $inputCol = $inputCols[$field];
            $currentCol = $currentCols[$field];

            if ($inputCol !== $currentCol) {
                $sql = "ALTER TABLE `$table` MODIFY COLUMN `$field` {$inputCol['Type']} " .
                       ($inputCol['Null'] === 'NO' ? 'NOT NULL' : 'NULL') .
                       (isset($inputCol['Default']) ? " DEFAULT " . ($inputCol['Default'] === null ? "NULL" : "'{$inputCol['Default']}'") : '') .
                       (!empty($inputCol['Extra']) ? " {$inputCol['Extra']}" : '') . ";";
                $changes[] = [
                    'type' => 'column-modified',
                    'table' => $table,
                    'column' => $field,
                    'from' => $currentCol,
                    'to' => $inputCol,
                    'sql' => $sql
                ];
            }
        }
    }

    return $changes;
}

// Main logic
$currentSchema = getCurrentSchema($conn);
$results = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['json_schema'])) {
    $jsonInput = $_POST['json_schema'];
    $parsed = json_decode($jsonInput, true);

    if (isset($parsed['schema']) && is_array($parsed['schema'])) {
        $results = compareSchemas($currentSchema, $parsed['schema']);
    } else {
        $results[] = ['type' => 'error', 'message' => 'Invalid JSON schema format'];
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Compare DB Schema</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .diff-added    { background-color: #d1e7dd; }
        .diff-removed  { background-color: #f8d7da; }
        .diff-modified { background-color: #fff3cd; }
        pre.code-block { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; white-space: pre-wrap; }
    </style>
</head>
<body class="p-4">
    <div class="container">
        <h2 class="mb-4">Compare Current DB Schema</h2>
        <form method="post">
            <div class="mb-3">
                <label for="json_schema" class="form-label">Paste exported JSON schema:</label>
                <textarea class="form-control" id="json_schema" name="json_schema" rows="12"><?php echo htmlspecialchars($_POST['json_schema'] ?? '') ?></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Compare</button>
        </form>

        <?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
            <hr>
            <h4 class="mt-4">Changes:</h4>

            <?php if (empty($results)): ?>
                <div class="alert alert-success mt-3">✅ No differences found. Schemas match.</div>
            <?php else: ?>
                <ul class="list-group mt-3">
                    <?php foreach ($results as $r): ?>
                        <li class="list-group-item
                            <?php
                                if ($r['type'] === 'column-added' || $r['type'] === 'table-added') echo 'diff-added';
                                elseif ($r['type'] === 'column-removed' || $r['type'] === 'table-removed') echo 'diff-removed';
                                elseif ($r['type'] === 'column-modified') echo 'diff-modified';
                            ?>">
                            <strong><?= ucfirst(str_replace('-', ' ', $r['type'])) ?></strong>
                            in table <code><?= $r['table'] ?></code>
                            <?= isset($r['column']) ? " → column <code>{$r['column']}</code>" : '' ?>
                            <pre class="code-block mt-2 mb-0"><?= $r['sql'] ?></pre>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        <?php endif; ?>

    </div>
</body>
</html>
