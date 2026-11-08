<?php
include_once(dirname(__FILE__, 2) . '/onload.php');
header('Content-Type: application/json; charset=utf-8');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $code = trim($input['code'] ?? '');
    $eventId = $input['eventId'] ?? '';
    if (!preg_match('/^[a-f0-9-]{36}$/i', $eventId)) throw new Exception('Invalid print event');
    if ($code === '') throw new Exception('กรุณาระบุเลขที่ใบส่งสินค้า');
    $db = new DbConnect;
    $conn = $db->connect();
    $conn->beginTransaction();
    $event = $conn->prepare('INSERT IGNORE INTO delivery_print_event (event_id) VALUES (:event_id)');
    $event->execute(['event_id' => $eventId]);
    if ($event->rowCount() === 0) {
        $conn->commit();
        echo json_encode(['status' => 1]);
        exit;
    }
    $stmt = $conn->prepare('UPDATE dnmaster SET print_count = COALESCE(print_count, 0) + 1 WHERE dncode = :code');
    $stmt->execute(['code' => $code]);
    if ($stmt->rowCount() !== 1) throw new Exception('ไม่พบใบส่งสินค้า');
    $conn->commit();
    echo json_encode(['status' => 1]);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
    http_response_code(400);
    echo json_encode(['message' => 'บันทึกจำนวนครั้งพิมพ์ไม่สำเร็จ กรุณาตรวจสอบการติดตั้ง SQL และการเชื่อมต่อ']);
}
