<?php
/* ============================================================================
   POST /api/ai/match.php   { scan_id, supcode }

   จับคู่สินค้าใหม่หลังผู้ใช้เลือกผู้ขายเอง (กรณี AI หาผู้ขายไม่เจอหรือเจอผิด)
   สินค้าของผู้ขายรายนั้นและชื่อที่เคยจำไว้จะถูกนำมาใช้
   ใช้ผลที่อ่านไว้แล้วจาก ai_docscan — ไม่อ่านรูปซ้ำ
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new AiUserException('request method fail.');
    ai_require_enabled();
    ai_require_tables($conn);

    $body = ai_read_json_body();
    $scanId = (int)($body['scan_id'] ?? 0);
    $supcode = trim((string)($body['supcode'] ?? ''));
    if ($scanId <= 0 || $supcode === '') throw new AiUserException('ต้องระบุ scan_id และ supcode');

    $st = $conn->prepare("SELECT status, model, extracted_json FROM ai_docscan WHERE scan_id = :id LIMIT 1");
    $st->execute(array('id' => $scanId));
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row || empty($row['extracted_json'])) throw new AiUserException('ไม่พบผลการสแกนนี้ กรุณาสแกนใหม่');

    $doc = json_decode($row['extracted_json'], true);
    if (!is_array($doc)) throw new AiUserException('ผลการสแกนเสียหาย กรุณาสแกนใหม่');

    $matcher = new ItemMatcher($conn);
    $supplier = $matcher->supplierByCode($supcode);
    if (!$supplier) throw new AiUserException('ไม่พบผู้ขายรหัส ' . $supcode);

    $mock = $row['status'] === 'mock';
    $log = new UsageLog($conn, ai_user_id());
    $matched = ai_match_lines($conn, $matcher, $log, $supcode, $doc, $scanId, $mock);

    $conn->prepare("UPDATE ai_docscan SET supcode = :s WHERE scan_id = :id")->execute(array('s' => $supcode, 'id' => $scanId));

    $sup = array('supplier' => $supplier, 'score' => 1.0, 'source' => 'manual', 'candidates' => array());
    ai_json(ai_response($scanId, $mock, (string)$row['model'], $doc, $sup, $matched, array()));
} catch (AiUserException $e) {
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    error_log('[ai/match] ' . $e->getMessage());
    ai_fail('จับคู่รายการไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
