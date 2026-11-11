<?php
include_once dirname(__DIR__) . '/onload.php';
include_once dirname(__DIR__) . '/common/fnc-code.php';
try {
    $db = new DbConnect;
    $conn = $db->connect();
    header('Cache-Control: no-store');
    $source = trim($_GET['duplicate_source'] ?? '');
    echo json_encode(array('data' => $source !== ''
        ? catalog_duplicate_number($conn, $source)
        : catalog_document_number($conn)));
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(array('message' => $e->getMessage()));
}
