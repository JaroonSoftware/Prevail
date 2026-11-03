<?php
/* ============================================================================
   รายการใน PO ที่ AI จับคู่สินค้าไม่มั่นใจ (ai_so_pending) ของใบขายสินค้า 1 ใบ

   GET    ?socode=IV...          -> รายการที่ยังรอจับคู่
   POST   { pending_id, stcode } -> ผู้ใช้จับคู่แล้ว (หน้าเว็บเพิ่มแถวลงตารางใบขายเอง)
                                    ลบแถวรอ + จำชื่อใน PO คู่กับรหัสสินค้า ครั้งหน้าจับคู่ได้เอง
   DELETE ?pending_id=...        -> ไม่เอารายการนี้ (ลบทิ้ง ไม่จำชื่อ)
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();

try {
    ai_require_so_tables($conn);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $socode = AiText::str($_GET['socode'] ?? null, 50);
        if ($socode === null) throw new AiUserException('ต้องระบุ socode');
        $st = $conn->prepare("
            SELECT p.pending_id, p.seq, p.raw_name, p.raw_code, p.qty, p.unit, p.price, p.suggest_stcode, p.confidence,
                   i.stname AS suggest_stname
            FROM ai_so_pending p LEFT JOIN items i ON i.stcode = p.suggest_stcode
            WHERE p.socode = :s ORDER BY p.seq, p.pending_id");
        $st->execute(array('s' => $socode));
        ai_json(array('status' => 1, 'data' => $st->fetchAll(PDO::FETCH_ASSOC)));
    } elseif ($method === 'POST') {
        $body = ai_read_json_body();
        $id = (int)($body['pending_id'] ?? 0);
        $stcode = AiText::str($body['stcode'] ?? null, 50);
        if ($id <= 0 || $stcode === null) throw new AiUserException('ต้องระบุ pending_id และ stcode');

        $st = $conn->prepare("SELECT p.*, m.cuscode, m.doc_status FROM ai_so_pending p JOIN somaster m ON m.socode = p.socode WHERE p.pending_id = :id");
        $st->execute(array('id' => $id));
        $p = $st->fetch(PDO::FETCH_ASSOC);
        if (!$p) throw new AiUserException('รายการนี้ถูกจัดการไปแล้ว');

        $conn->beginTransaction();
        $lock = $conn->prepare("SELECT doc_status FROM somaster WHERE socode = :s FOR UPDATE");
        $lock->execute(array('s' => $p['socode']));
        if ($lock->fetchColumn() !== SoDraft::STATUS_DRAFT) throw new AiUserException('ใบขายนี้ไม่ได้อยู่ในสถานะรอยืนยันใบขาย');
        $valid = $conn->prepare("SELECT COUNT(*) FROM sodetail d JOIN items i ON i.stcode = d.stcode
                                WHERE d.socode = :s AND d.stcode = :c AND i.active_status = 'Y'");
        $valid->execute(array('s' => $p['socode'], 'c' => $stcode));
        if ((int)$valid->fetchColumn() < 1) throw new AiUserException('กรุณาบันทึกรหัสสินค้าที่จับคู่ลงในใบขายก่อน');
        $norm = AiText::norm($p['raw_name']);
        if ($norm !== '' && $p['cuscode']) {
            $ins = $conn->prepare("
                INSERT INTO ai_item_alias (supcode, raw_text, raw_norm, raw_hash, stcode, created_by)
                VALUES (:s, :t, :n, :h, :c, :u)
                ON DUPLICATE KEY UPDATE stcode = VALUES(stcode), raw_text = VALUES(raw_text), hit_count = hit_count + 1");
            $ins->execute(array(
                's' => SoDraft::aliasKey((string)$p['cuscode']),
                't' => mb_substr($p['raw_name'], 0, 160, 'UTF-8'), 'n' => mb_substr($norm, 0, 160, 'UTF-8'),
                'h' => sha1($norm), 'c' => $stcode, 'u' => ai_user_id(),
            ));
        }
        $conn->prepare("DELETE FROM ai_so_pending WHERE pending_id = :id")->execute(array('id' => $id));
        $conn->commit();
        ai_json(array('status' => 1));
    } elseif ($method === 'DELETE') {
        $id = (int)($_GET['pending_id'] ?? 0);
        if ($id <= 0) throw new AiUserException('กรุณาระบุ pending_id');
        $find = $conn->prepare("SELECT socode FROM ai_so_pending WHERE pending_id = :id");
        $find->execute(array('id' => $id));
        $socode = $find->fetchColumn();
        if (!$socode) throw new AiUserException('ไม่พบรายการรอจับคู่');
        $conn->beginTransaction();
        $lock = $conn->prepare("SELECT doc_status FROM somaster WHERE socode = :s FOR UPDATE");
        $lock->execute(array('s' => $socode));
        if ($lock->fetchColumn() !== SoDraft::STATUS_DRAFT) {
            throw new AiUserException('ลบได้เฉพาะรายการในใบขายที่รอยืนยัน');
        }
        $delete = $conn->prepare("DELETE FROM ai_so_pending WHERE pending_id = :id AND socode = :s");
        $delete->execute(array('id' => $id, 's' => $socode));
        if ($delete->rowCount() !== 1) throw new AiUserException('รายการนี้ถูกเปลี่ยนแปลงแล้ว กรุณาโหลดหน้าใหม่');
        $conn->commit();
        ai_json(array('status' => 1));
    } else {
        throw new AiUserException('request method fail.');
    }
} catch (AiUserException $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    error_log('[ai/so-pending] ' . $e->getMessage());
    ai_fail('ทำรายการไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
