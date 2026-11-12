<?php
/* ============================================================================
   POST /api/ai/so-confirm.php  { socode }

   ยืนยันใบขายสินค้าที่สร้างจาก PO ด้วย AI: "รอยืนยัน" -> "รอออกใบส่งของ"
   หลังยืนยันแล้ว ใบนี้จึงเข้าระบบอื่นตามปกติ (ใบจัดสินค้า ใบส่งของ รายงานเตรียมของ)

   หน้าเว็บบันทึกการแก้ไขใบขายก่อน (so/manage.php PUT) แล้วค่อยเรียกไฟล์นี้
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new AiUserException('request method fail.');
    ai_require_so_tables($conn);

    $body = ai_read_json_body();
    $socode = AiText::str($body['socode'] ?? null, 50);
    if ($socode === null) throw new AiUserException('ต้องระบุ socode');

    $conn->beginTransaction();
    $st = $conn->prepare("SELECT doc_status FROM somaster WHERE socode = :s FOR UPDATE");
    $st->execute(array('s' => $socode));
    $status = $st->fetchColumn();
    if ($status === false) throw new AiUserException("ไม่พบใบขายสินค้า $socode");
    if ($status !== SoDraft::STATUS_DRAFT) throw new AiUserException("ใบขายสินค้า $socode ไม่ได้อยู่ในสถานะ รอยืนยัน (ตอนนี้: $status)");

    $st = $conn->prepare("SELECT COUNT(*) FROM ai_so_pending WHERE socode = :s");
    $st->execute(array('s' => $socode));
    $left = (int)$st->fetchColumn();
    if ($left > 0) throw new AiUserException("ยังมีรายการจาก PO ที่ยังไม่ได้จับคู่สินค้า $left รายการ");

    $st = $conn->prepare("SELECT COUNT(*) FROM sodetail WHERE socode = :s");
    $st->execute(array('s' => $socode));
    if ((int)$st->fetchColumn() < 1) throw new AiUserException('ใบขายสินค้านี้ยังไม่มีรายการสินค้า');

    // A nonempty code must refer to an active product, even for direct API calls.
    $st = $conn->prepare("SELECT COUNT(*) FROM sodetail d LEFT JOIN items i ON i.stcode = d.stcode
                         WHERE d.socode = :s AND (NULLIF(TRIM(d.stcode), '') IS NULL OR i.stcode IS NULL OR COALESCE(i.active_status, '') <> 'Y')");
    $st->execute(array('s' => $socode));
    if ((int)$st->fetchColumn() > 0) throw new AiUserException('ไม่สามารถยืนยันใบขายได้ ต้องจับคู่รหัสสินค้าที่ใช้งานครบทุกรายการ');

    /* จำทุกบรรทัดที่มาจาก PO: ชื่อ/รหัสสินค้าลูกค้าใน PO = สินค้าที่ใช้จริงตอนยืนยัน
       (รวมบรรทัดที่ผู้ใช้เปลี่ยนสินค้าในตาราง — ครั้งหน้า AI จับคู่ถูกเอง) */
    $learned = 0;
    if (SoDraft::hasSourceCols($conn)) {
        $cus = $conn->prepare("SELECT cuscode FROM somaster WHERE socode = :s");
        $cus->execute(array('s' => $socode));
        $cuscode = (string)$cus->fetchColumn();
        $src = $conn->prepare("SELECT stcode, ai_raw, ai_raw_code, ai_stcode FROM sodetail
                               WHERE socode = :s AND (COALESCE(ai_raw, '') <> '' OR COALESCE(ai_raw_code, '') <> '')");
        $src->execute(array('s' => $socode));
        foreach ($src->fetchAll(PDO::FETCH_ASSOC) as $r) {
            SoDraft::rememberItem($conn, $cuscode, $r['ai_raw'], $r['ai_raw_code'], (string)$r['stcode'], ai_user_id());
            if ((string)$r['stcode'] !== (string)$r['ai_stcode']) $learned++;
        }
    }

    $st = $conn->prepare("UPDATE somaster SET doc_status = :ready, updated_date = :d, updated_by = :u
                          WHERE socode = :s AND doc_status = :draft");
    $st->execute(array(
        'ready' => SoDraft::STATUS_READY, 'draft' => SoDraft::STATUS_DRAFT,
        'd' => date('Y-m-d H:i:s'), 'u' => ai_user_id(), 's' => $socode,
    ));
    if ($st->rowCount() !== 1) throw new AiUserException('สถานะใบขายเปลี่ยนแล้ว กรุณาโหลดใหม่');
    $conn->commit();
    ai_json(array('status' => 1, 'data' => array('socode' => $socode, 'doc_status' => SoDraft::STATUS_READY, 'learned' => $learned)));
} catch (AiUserException $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    error_log('[ai/so-confirm] ' . $e->getMessage());
    ai_fail('ยืนยันใบขายสินค้าไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
