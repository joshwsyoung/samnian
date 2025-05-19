<?php
require_once 'config.php';
$diff = [];

function getCurrentSchema($conn) {
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $schema = [];

    foreach ($tables as $table) {
        $columns = $conn->query("DESCRIBE `$table`")->fetchAll();
        $schema[$table] = array_column($columns, null, 'Field');
    }

    return $schema;
}

function compareSchemas($current, $input) {
    $changes = [];

    $inputTables = array_keys($input);
    $currentTables = array_keys($current);

    $addedTables = array_diff($inputTables, $currentTables);
    $removedTables = array_diff($currentTables, $inputTables);
    $sharedTables = array_intersect($inputTables, $currentTables);

    foreach ($addedTables as $t) {
        $changes[] = ['type' => 'table-added', 'table' => $t];
    }

    foreach ($removedTables as $t) {
        $changes[] = ['type' => 'table-removed', 'table' => $t];
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
            $changes[] = ['type' => 'column-added', 'table' => $table, 'column' => $field];
        }

        foreach ($removed as $field) {
            $changes[] = ['type' => 'column-removed', 'table' => $table, 'column' => $field];
        }

        foreach ($common as $field) {
            $inputCol = $inputCols[$field];
            $currentCol = $currentCols[$field];

            if (
                $inputCol['Type']    !== $currentCol['Type'] ||
                $inputCol['Null']    !== $currentCol['Null'] ||
                $inputCol['Key']     !== $currentCol['Key'] ||
                $inputCol['Default'] !== $currentCol['Default'] ||
                $inputCol['Extra']   !== $currentCol['Extra']
            ) {
                $changes[] = ['type' => 'column-modified', 'table' => $table, 'column' => $field, 'from' => $currentCol, 'to' => $inputCol];
            }
        }
    }

    return $changes;
}

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
        .diff-added { background-color: #d1e7dd; }
        .diff-removed { background-color: #f8d7da; }
        .diff-modified { background-color: #fff3cd; }
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

        <?php if ($results): ?>
            <hr>
            <h4 class="mt-4">Changes:</h4>
            <ul class="list-group mt-3">
                <?php foreach ($results as $r): ?>
                    <?php if ($r['type'] === 'table-added'): ?>
                        <li class="list-group-item diff-added">+ Table added: <strong><?= $r['table'] ?></strong></li>
                    <?php elseif ($r['type'] === 'table-removed'): ?>
                        <li class="list-group-item diff-removed">− Table removed: <strong><?= $r['table'] ?></strong></li>
                    <?php elseif ($r['type'] === 'column-added'): ?>
                        <li class="list-group-item diff-added">+ Column added in <strong><?= $r['table'] ?></strong>: <code><?= $r['column'] ?></code></li>
                    <?php elseif ($r['type'] === 'column-removed'): ?>
                        <li class="list-group-item diff-removed">− Column removed from <strong><?= $r['table'] ?></strong>: <code><?= $r['column'] ?></code></li>
                    <?php elseif ($r['type'] === 'column-modified'): ?>
                        <li class="list-group-item diff-modified">
                            ∆ Column changed in <strong><?= $r['table'] ?></strong>: <code><?= $r['column'] ?></code><br>
                            <small><strong>From:</strong> <?= json_encode($r['from']) ?> <br>
                            <strong>To:</strong> <?= json_encode($r['to']) ?></small>
                        </li>
                    <?php elseif ($r['type'] === 'error'): ?>
                        <li class="list-group-item text-danger"><?= htmlspecialchars($r['message']) ?></li>
                    <?php endif; ?>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
</body>
</html>
