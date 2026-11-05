<?php
include_once dirname(__DIR__) . '/onload.php';
include_once dirname(__DIR__) . '/common/fnc-code.php';
try {
    $db = new DbConnect;
    $conn = $db->connect();
    header('Cache-Control: no-store');
    echo json_encode(array('data' => catalog_document_number($conn)));
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(array('message' => $e->getMessage()));
}
