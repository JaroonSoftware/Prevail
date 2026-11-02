<?php
/* ============================================================================
   POST /api/ai/so-import.php

   แบบที่ 1 อัปโหลดไฟล์ (multipart/form-data): file, cuscode? (ไม่บังคับ)
     -> AI อ่าน PO ลูกค้า -> หาลูกค้า -> สร้างใบขายสินค้าสถานะ "รอยืนยัน"
     ถ้าหาลูกค้าไม่เจอ คืน need_customer + ตัวเลือก ให้หน้าเว็บเลือกแล้วเรียกแบบที่ 2

   แบบที่ 2 JSON: { import_id, cuscode }
     -> ใช้ผลที่อ่านไว้แล้ว (ไม่เรียก AI อ่านไฟล์ซ้ำ ไม่เสียเงินซ้ำ) สร้างใบขายสินค้า
        และจำชื่อลูกค้าบนหัว PO ไว้ ครั้งหน้าจับคู่ได้เอง
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
include_once(dirname(__DIR__) . "/common/fnc-code.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();
$importId = null;
$log = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new AiUserException('request method fail.');
    ai_require_enabled();
    ai_require_tables($conn);
    ai_require_so_tables($conn);

    $userId = ai_user_id();
    $log = new UsageLog($conn, $userId);
    $mock = ai_flag('AI_MOCK');
    $model = (string)ai_cfg('AI_MODEL', 'claude-sonnet-5-5');
    $fileName = '';

    $isJson = stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== false;

    if ($isJson) {
        /* ---------- แบบที่ 2: เลือกลูกค้าแล้ว สร้างใบขายจากผลที่อ่านไว้ ---------- */
        $body = ai_read_json_body();
        $importId = (int)($body['import_id'] ?? 0);
        $cuscode = AiText::str($body['cuscode'] ?? null, 50);
        if ($importId <= 0 || $cuscode === null) throw new AiUserException('ต้องระบุ import_id และ cuscode');

        $st = $conn->prepare("SELECT * FROM ai_so_import WHERE import_id = :id");
        $st->execute(array('id' => $importId));
        $imp = $st->fetch(PDO::FETCH_ASSOC);
        if (!$imp) throw new AiUserException('ไม่พบไฟล์ที่อ่านไว้ กรุณาอัปโหลดใหม่');
        if ($imp['status'] === 'done') throw new AiUserException('ไฟล์นี้สร้างใบขายสินค้าไปแล้ว: ' . $imp['socodes']);
        $doc = json_decode((string)$imp['extracted_json'], true);
        if (!is_array($doc) || empty($doc['orders'])) throw new AiUserException('ผลการอ่านไฟล์นี้ไม่มีรายการสั่งซื้อ');
        $fileName = (string)$imp['file_name'];
        $mock = $imp['model'] === 'mock';
    } else {
        /* ---------- แบบที่ 1: อัปโหลดไฟล์ ให้ AI อ่าน ---------- */
        @set_time_limit(max(300, (int)ai_cfg('AI_TIMEOUT_SEC', 90)) * 2 + 60);
        $cuscode = AiText::str($_POST['cuscode'] ?? null, 50);

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
        if ($mime === 'image/heic') throw new AiUserException('ไฟล์ HEIC จาก iPhone ยังไม่รองรับ — ส่งเป็น JPG/PNG หรือ PDF');
        if ($mime === null) throw new AiUserException('รองรับเฉพาะรูป JPG / PNG / WEBP หรือไฟล์ PDF');

        $stored = ai_store_upload($f['tmp_name'], $mime);
        $sendPath = $stored['abs'];
        $sendMime = $mime;
        if ($mime !== 'application/pdf' && filesize($sendPath) > 3.5 * 1024 * 1024) {
            $small = ai_shrink_image($sendPath);
            if (!$small) throw new AiUserException('รูปใหญ่เกินไป และเซิร์ฟเวอร์ย่อรูปไม่ได้ (ไม่มี GD)');
            $sendPath = $small;
            $sendMime = 'image/jpeg';
        }
        $fileName = mb_substr((string)($f['name'] ?? ''), 0, 255, 'UTF-8');

        $st = $conn->prepare("INSERT INTO ai_so_import (created_by, file_path, file_name, mime, model, status)
                              VALUES (:u, :p, :n, :m, :model, 'processing')");
        $st->execute(array('u' => $userId, 'p' => $stored['rel'], 'n' => $fileName, 'm' => $mime, 'model' => $mock ? 'mock' : $model));
        $importId = (int)$conn->lastInsertId();

        if ($mock) {
            $doc = PoReader::mock($conn);
            usleep(600000);
            $log->write(array('feature' => 'so_po_read', 'model' => 'mock', 'status' => 'mock', 'usage' => array()));
        } else {
            /* PDF หลายหน้าใช้เวลาอ่านนานกว่าบิลใบเดียวมาก -> เผื่อเวลารออย่างน้อย 5 นาที */
            $client = new ClaudeClient(
                trim((string)ai_cfg('ANTHROPIC_API_KEY', '')) ?: ai_client_key_missing(),
                max(300, (int)ai_cfg('AI_TIMEOUT_SEC', 90)),
                (string)ai_cfg('AI_CA_BUNDLE', ''),
                (string)ai_cfg('AI_API_URL', '')
            );
            $res = (new PoReader($client, $model))->read($sendPath, $sendMime);
            $doc = $res['document'];
            $call = $res['call'];
            $log->write(array(
                'feature' => 'so_po_read', 'model' => $model, 'status' => 'ok',
                'usage' => $call['usage'] + array('ms' => $call['ms'], 'request_id' => $call['request_id'], 'workspace_id' => $call['workspace_id']),
                'price_in' => (float)ai_cfg('AI_PRICE_IN', 0), 'price_out' => (float)ai_cfg('AI_PRICE_OUT', 0),
            ));
        }

        $st = $conn->prepare("UPDATE ai_so_import SET status = 'read', extracted_json = :j WHERE import_id = :id");
        $st->execute(array('j' => json_encode($doc, JSON_UNESCAPED_UNICODE), 'id' => $importId));

        if (empty($doc['orders'])) throw new AiUserException('ไม่พบรายการสั่งซื้อในไฟล์นี้ — ตรวจว่าเป็นไฟล์ PO/ใบขอซื้อของลูกค้า');
    }

    /* ---------- ลูกค้า ---------- */
    $customer = $cuscode !== null ? SoDraft::customerByCode($conn, $cuscode) : null;
    if ($cuscode !== null && !$customer) throw new AiUserException("ไม่พบลูกค้ารหัส $cuscode");
    $cusMatch = null;
    if (!$customer) {
        $cusMatch = SoDraft::matchCustomer($conn, $doc['customer'] ?? array());
        $customer = $cusMatch['customer'];
    }
    if (!$customer) {
        $st = $conn->prepare("UPDATE ai_so_import SET status = 'need_customer' WHERE import_id = :id");
        $st->execute(array('id' => $importId));
        ai_json(array('status' => 1, 'data' => array(
            'import_id' => $importId, 'need_customer' => true, 'mock' => $mock,
            'document' => ai_so_summary($doc),
            'candidates' => $cusMatch['candidates'] ?? array(),
        )));
        exit;
    }
    $cuscode = (string)$customer['cuscode'];

    /* ---------- สร้างร่างใบขายสินค้า ---------- */
    $conn->beginTransaction();
    if ($cusMatch === null) SoDraft::rememberCustomer($conn, $doc['customer']['name'] ?? null, $cuscode, $userId);
    $created = SoDraft::create($conn, new ItemMatcher($conn), $log, $doc, $cuscode, $importId, $userId, $mock, $fileName);
    $st = $conn->prepare("UPDATE ai_so_import SET status = 'done', cuscode = :c, socodes = :s WHERE import_id = :id");
    $st->execute(array('c' => $cuscode, 's' => mb_substr(implode(',', array_column($created, 'socode')), 0, 500), 'id' => $importId));
    $conn->commit();

    ai_json(array('status' => 1, 'data' => array(
        'import_id' => $importId, 'need_customer' => false, 'mock' => $mock,
        'customer' => array('cuscode' => $cuscode, 'cusname' => trim(($customer['prename'] ?? '') . ' ' . $customer['cusname'])),
        'customer_source' => $cusMatch['source'] ?? 'user',
        'document' => ai_so_summary($doc),
        'sales_orders' => $created,
    )));
} catch (AiUserException $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    ai_so_import_failed($conn, $importId, $e->getMessage());
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    error_log('[ai/so-import] ' . $e->getMessage());
    ai_so_import_failed($conn, $importId, $e->getMessage());
    if ($log) $log->write(array('feature' => 'so_po_read', 'model' => (string)ai_cfg('AI_MODEL', ''), 'status' => 'error', 'error' => $e->getMessage()));
    ai_fail('สร้างใบขายสินค้าจาก PO ไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;

function ai_client_key_missing(): string
{
    throw new AiUserException('ยังไม่ได้ตั้ง ANTHROPIC_API_KEY ใน api/ai/.env.ai (หรือเปิด AI_MOCK=1 เพื่อทดสอบ)');
}

/** ย่อผลที่อ่านได้ ให้หน้าเว็บแสดง (ไม่ส่งทุกบรรทัด) */
function ai_so_summary(array $doc): array
{
    return array(
        'customer' => $doc['customer'] ?? null,
        'notes' => $doc['notes'] ?? null,
        'orders' => array_map(function ($o) {
            return array('po_no' => $o['po_no'], 'delivery_date' => $o['delivery_date'], 'location' => $o['location'], 'lines' => count($o['lines']));
        }, $doc['orders'] ?? array()),
    );
}

function ai_so_import_failed(?PDO $conn, ?int $importId, string $message): void
{
    if (!$conn || !$importId) return;
    try {
        $st = $conn->prepare("UPDATE ai_so_import SET status = IF(status = 'read' OR status = 'need_customer', status, 'error'), error_message = :e WHERE import_id = :id");
        $st->execute(array('e' => mb_substr($message, 0, 250, 'UTF-8'), 'id' => $importId));
    } catch (Throwable $e) {
    }
}
