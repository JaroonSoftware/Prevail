<?php
/* ============================================================================
   POST /api/ai/scan.php   (multipart/form-data, field "file")

   รับรูป/PDF ใบส่งของหรือบิล -> ให้ AI อ่าน -> จับคู่ผู้ขายและสินค้าในทะเบียน
   คืนข้อมูลให้หน้าเว็บแสดงเทียบกับรูป ผู้ใช้ตรวจแล้วค่อยส่งไปฟอร์มสร้างใบสั่งซื้อ
   ไม่บันทึกใบสั่งซื้อ ไม่แตะสต๊อก (ใบสั่งซื้อของ Prevail ตัดเข้าสต๊อกทันทีที่บันทึก)
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();
$scanId = null;
$log = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new AiUserException('request method fail.');
    ai_require_enabled();
    ai_require_tables($conn);
    @set_time_limit((int)ai_cfg('AI_TIMEOUT_SEC', 90) * 2 + 30);

    $userId = ai_user_id();
    $log = new UsageLog($conn, $userId);
    $mock = ai_flag('AI_MOCK');
    $model = (string)ai_cfg('AI_MODEL', 'claude-sonnet-5-5');

    /* ---------- ตรวจไฟล์ ---------- */
    if (empty($_FILES['file']) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        throw new AiUserException('ไฟล์ใหญ่เกินที่เซิร์ฟเวอร์รับได้ (post_max_size ใน php.ini)');
    }
    $f = $_FILES['file'] ?? null;
    if (!$f || !isset($f['error'])) throw new AiUserException('ไม่พบไฟล์ที่อัปโหลด');
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
        throw new AiUserException('ไฟล์ใหญ่เกินที่เซิร์ฟเวอร์รับได้ (upload_max_filesize ใน php.ini)');
    }
    if ($f['error'] !== UPLOAD_ERR_OK) throw new AiUserException('อัปโหลดไฟล์ไม่สำเร็จ (รหัส ' . (int)$f['error'] . ')');

    $maxBytes = (float)ai_cfg('AI_MAX_UPLOAD_MB', 10) * 1024 * 1024;
    if ($f['size'] > $maxBytes) throw new AiUserException('ไฟล์ใหญ่เกิน ' . ai_cfg('AI_MAX_UPLOAD_MB', 10) . ' MB');

    $mime = ai_detect_mime($f['tmp_name']);
    if ($mime === 'image/heic') {
        throw new AiUserException('ไฟล์ HEIC จาก iPhone ยังไม่รองรับ — ถ่ายผ่านหน้าเว็บนี้ (ระบบแปลงเป็น JPG ให้) หรือตั้งกล้องเป็น "เข้ากันได้มากที่สุด"');
    }
    if ($mime === null) throw new AiUserException('รองรับเฉพาะรูป JPG / PNG / WEBP หรือไฟล์ PDF');

    $stored = ai_store_upload($f['tmp_name'], $mime);
    $sendPath = $stored['abs'];
    $sendMime = $mime;

    /* รูปที่ส่งให้ AI ต้องไม่เกินราว 5 MB — ปกติหน้าเว็บย่อให้แล้ว อันนี้กันไว้อีกชั้น */
    if ($mime !== 'application/pdf' && filesize($sendPath) > 3.5 * 1024 * 1024) {
        $small = ai_shrink_image($sendPath);
        if (!$small) throw new AiUserException('รูปใหญ่เกินไป และเซิร์ฟเวอร์ย่อรูปไม่ได้ (ไม่มี GD) — ลองถ่ายใหม่ให้เล็กลง');
        $sendPath = $small;
        $sendMime = 'image/jpeg';
    }

    $st = $conn->prepare("INSERT INTO ai_docscan (created_by, file_path, file_name, mime, model, status)
                          VALUES (:u, :p, :n, :m, :model, 'processing')");
    $st->execute(array(
        'u' => $userId, 'p' => $stored['rel'],
        'n' => mb_substr((string)($f['name'] ?? ''), 0, 255, 'UTF-8'),
        'm' => $mime, 'model' => $mock ? 'mock' : $model,
    ));
    $scanId = (int)$conn->lastInsertId();

    /* ---------- อ่านเอกสาร ---------- */
    $usage = array('input_tokens' => 0, 'output_tokens' => 0, 'cost_usd' => 0, 'ms' => 0);
    if ($mock) {
        $t0 = microtime(true);
        $doc = MockDoc::build($conn);
        usleep(600000);   // ให้หน้าเว็บเห็นสถานะ "กำลังอ่าน" ใกล้เคียงของจริง
        $usage['ms'] = (int)round((microtime(true) - $t0) * 1000);
        $log->write(array('feature' => 'po_docscan', 'model' => 'mock', 'status' => 'mock', 'usage' => $usage, 'scan_id' => $scanId));
    } else {
        $reader = new DocReader(ai_client(), $model);
        $res = $reader->read($sendPath, $sendMime);
        $doc = $res['document'];
        $call = $res['call'];
        $cost = $log->write(array(
            'feature' => 'po_docscan', 'model' => $model, 'status' => 'ok',
            'usage' => $call['usage'] + array('ms' => $call['ms'], 'request_id' => $call['request_id'], 'workspace_id' => $call['workspace_id']),
            'price_in' => (float)ai_cfg('AI_PRICE_IN', 0), 'price_out' => (float)ai_cfg('AI_PRICE_OUT', 0),
            'scan_id' => $scanId,
        ));
        $usage = array(
            'input_tokens' => $call['usage']['input_tokens'],
            'output_tokens' => $call['usage']['output_tokens'],
            'cost_usd' => round($cost, 6),
            'ms' => $call['ms'],
        );
    }

    /* ---------- จับคู่ ---------- */
    $matcher = new ItemMatcher($conn);
    $sup = $matcher->matchSupplier($doc['supplier'] ?? array());
    $matched = ai_match_lines($conn, $matcher, $log, $sup['supplier']['supcode'] ?? null, $doc, $scanId, $mock);

    $st = $conn->prepare("UPDATE ai_docscan SET status = :s, supcode = :sup, document_no = :no, extracted_json = :j WHERE scan_id = :id");
    $st->execute(array(
        's' => $mock ? 'mock' : 'ok',
        'sup' => $sup['supplier']['supcode'] ?? null,
        'no' => $doc['document_no'] ?? null,
        'j' => json_encode($doc, JSON_UNESCAPED_UNICODE),
        'id' => $scanId,
    ));

    ai_json(ai_response($scanId, $mock, $model, $doc, $sup, $matched, $usage));
} catch (AiUserException $e) {
    ai_scan_failed($conn, $scanId, $log, $e->getMessage());
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    error_log('[ai/scan] ' . $e->getMessage());
    ai_scan_failed($conn, $scanId, $log, $e->getMessage());
    ai_fail('อ่านใบส่งของไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;

function ai_scan_failed(?PDO $conn, ?int $scanId, ?UsageLog $log, string $message): void
{
    if (!$conn || !$scanId) return;
    try {
        $st = $conn->prepare("UPDATE ai_docscan SET status = 'error', error_message = :e WHERE scan_id = :id");
        $st->execute(array('e' => mb_substr($message, 0, 150, 'UTF-8'), 'id' => $scanId));
        if ($log) $log->write(array('feature' => 'po_docscan', 'model' => (string)ai_cfg('AI_MODEL', ''), 'status' => 'error', 'error' => $message, 'scan_id' => $scanId));
    } catch (Throwable $e) {
    }
}
