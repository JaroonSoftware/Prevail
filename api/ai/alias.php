<?php
/* ============================================================================
   POST /api/ai/alias.php
   { supcode, supplier_raw?, items: [ { raw_text, stcode } ] }

   จำชื่อที่ผู้ขายพิมพ์ในใบส่งของ คู่กับรหัสในระบบ ตามที่ผู้ใช้ยืนยันแล้ว
   ครั้งหน้าเจอชื่อเดิมจากผู้ขายรายเดิม ระบบจับคู่ให้ทันทีโดยไม่ต้องเดา
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new AiUserException('request method fail.');
    ai_require_tables($conn);

    $body = ai_read_json_body();
    $supcode = AiText::str($body['supcode'] ?? null, 50);
    if ($supcode === null) throw new AiUserException('ต้องระบุ supcode');
    $user = ai_user_id();
    $saved = 0;

    $conn->beginTransaction();

    $supRaw = AiText::str($body['supplier_raw'] ?? null, 160);
    $supNorm = AiText::normCompany($supRaw);
    if ($supNorm !== '') {
        $st = $conn->prepare("
            INSERT INTO ai_supplier_alias (raw_text, raw_norm, raw_hash, supcode, created_by)
            VALUES (:t, :n, :h, :s, :u)
            ON DUPLICATE KEY UPDATE supcode = VALUES(supcode), raw_text = VALUES(raw_text), hit_count = hit_count + 1");
        $st->execute(array('t' => $supRaw, 'n' => mb_substr($supNorm, 0, 160, 'UTF-8'), 'h' => sha1($supNorm), 's' => $supcode, 'u' => $user));
        $saved++;
    }

    $st = $conn->prepare("
        INSERT INTO ai_item_alias (supcode, raw_text, raw_norm, raw_hash, stcode, created_by)
        VALUES (:s, :t, :n, :h, :c, :u)
        ON DUPLICATE KEY UPDATE stcode = VALUES(stcode), raw_text = VALUES(raw_text), hit_count = hit_count + 1");
    foreach (($body['items'] ?? array()) as $it) {
        if (!is_array($it)) continue;
        $raw = AiText::str($it['raw_text'] ?? null, 160);
        $stcode = AiText::str($it['stcode'] ?? null, 50);
        $norm = AiText::norm($raw);
        if ($raw === null || $stcode === null || $norm === '') continue;
        $st->execute(array('s' => $supcode, 't' => $raw, 'n' => mb_substr($norm, 0, 160, 'UTF-8'), 'h' => sha1($norm), 'c' => $stcode, 'u' => $user));
        $saved++;
    }

    $conn->commit();
    ai_json(array('status' => 1, 'saved' => $saved));
} catch (AiUserException $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    error_log('[ai/alias] ' . $e->getMessage());
    ai_fail('บันทึกการจับคู่ไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
