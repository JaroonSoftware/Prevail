<?php
/* ============================================================================
   ล้าง barcode หน้าถุงที่สร้างไว้แล้ว เพื่อปริ้นใหม่ (สร้างถุงใหม่ตามจำนวน/น้ำหนักล่าสุด)
   POST { detail: [{ socode, stcode, code }] }   (code = sodetail.code บรรทัดในใบขาย)

   - ถุงที่สแกนส่งของไปแล้ว (มีเลขใบส่งของ หรือสถานะ "ขายแล้ว") ล้างไม่ได้ ทั้งรายการจะถูกยกเลิก
   - ล้างแล้ว: ลบแถวใน package_barcode, บรรทัดใบขายกลับเป็น "ยังไม่ปริ้นหน้าถุง",
     สถานะปริ้นของใบขายคำนวณใหม่
   - ถุงแบบเดิมที่ไม่ได้ผูกบรรทัด (ก่อนรัน sql/2026-11-11_package_barcode_line.sql)
     ล้างตาม ใบขาย+รหัสสินค้า (ทุกบรรทัดของสินค้านั้นกลับเป็นยังไม่ปริ้น)
   ============================================================================ */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");

$db = new DbConnect;
$conn = $db->connect();

function clear_json($data, int $code = 200): void
{
    if (ob_get_length()) ob_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception('request method fail.');
    $body = json_decode(file_get_contents('php://input') ?: '[]', true) ?: array();
    $detail = $body['detail'] ?? array();
    if (!is_array($detail) || !$detail) throw new Exception('กรุณาเลือกรายการที่จะล้าง barcode');

    $cols = array();
    foreach ($conn->query("SHOW COLUMNS FROM package_barcode")->fetchAll(PDO::FETCH_ASSOC) as $c) $cols[$c['Field']] = true;
    $hasLine = isset($cols['sodetail_code']);
    /* เงื่อนไข "ถุงถูกใช้ส่งของแล้ว" ตามคอลัมน์ที่มีจริง */
    $usedCond = array();
    if (isset($cols['dncode'])) $usedCond[] = "COALESCE(dncode, '') <> ''";
    if (isset($cols['doc_status'])) $usedCond[] = "COALESCE(doc_status, '') = 'ขายแล้ว'";
    $usedSql = $usedCond ? '(' . implode(' OR ', $usedCond) . ')' : '0';

    $conn->beginTransaction();
    $removed = 0;
    $socodes = array();
    $blocked = array();

    foreach ($detail as $val) {
        $so = (string)($val['socode'] ?? '');
        $st = (string)($val['stcode'] ?? '');
        $line = (isset($val['code']) && is_numeric($val['code'])) ? (int)$val['code'] : 0;
        if ($so === '' || $st === '') continue;
        $socodes[$so] = true;

        /* ถุงของบรรทัดนี้ + ถุงแบบเดิมของสินค้านี้ที่ไม่ได้ผูกบรรทัด */
        $where = "socode = :s AND stcode = :i AND (" . ($hasLine && $line > 0 ? "sodetail_code = :l OR " : "") . ($hasLine ? "sodetail_code IS NULL" : "1=1") . ")";
        $params = array('s' => $so, 'i' => $st);
        if ($hasLine && $line > 0) $params['l'] = $line;

        $chk = $conn->prepare("SELECT COUNT(*) FROM package_barcode WHERE $where AND $usedSql");
        $chk->execute($params);
        if ((int)$chk->fetchColumn() > 0) { $blocked[] = $st; continue; }

        $legacy = 0;
        if ($hasLine) {
            $lg = $conn->prepare("SELECT COUNT(*) FROM package_barcode WHERE socode = :s AND stcode = :i AND sodetail_code IS NULL");
            $lg->execute(array('s' => $so, 'i' => $st));
            $legacy = (int)$lg->fetchColumn();
        }

        $del = $conn->prepare("DELETE FROM package_barcode WHERE $where");
        $del->execute($params);
        $removed += $del->rowCount();

        /* บรรทัดใบขายกลับเป็นยังไม่ปริ้น (ถุงแบบเดิม = ทุกบรรทัดของสินค้านี้) */
        if ($hasLine && $line > 0 && $legacy === 0) {
            $conn->prepare("UPDATE sodetail SET packing_status = 'ยังไม่ปริ้นหน้าถุง' WHERE socode = :s AND code = :l")
                ->execute(array('s' => $so, 'l' => $line));
        } else {
            $conn->prepare("UPDATE sodetail SET packing_status = 'ยังไม่ปริ้นหน้าถุง' WHERE socode = :s AND stcode = :i")
                ->execute(array('s' => $so, 'i' => $st));
        }
    }

    if ($blocked) {
        $conn->rollBack();
        throw new Exception('ล้างไม่ได้: มีถุงที่สแกนส่งของไปแล้ว (' . implode(', ', array_unique($blocked)) . ') — ไม่มีรายการใดถูกล้าง');
    }

    /* สถานะปริ้นของใบขายคำนวณใหม่ */
    $cnt = $conn->prepare("SELECT COUNT(*) FROM package_barcode WHERE socode = :s");
    $upd = $conn->prepare("UPDATE somaster SET print_status = :p, updated_date = CURRENT_TIMESTAMP(), updated_by = :u WHERE socode = :s");
    foreach (array_keys($socodes) as $so) {
        $cnt->execute(array('s' => $so));
        $upd->execute(array('p' => (int)$cnt->fetchColumn() > 0 ? 'ปริ้นใบปะยังไม่ครบ' : 'รอปริ้นใบปะหน้าถุง', 'u' => $token->userid ?? null, 's' => $so));
    }

    $conn->commit();
    clear_json(array('status' => 1, 'data' => array('removed' => $removed)));
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    clear_json(array('status' => 0, 'message' => $e->getMessage()), 400);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
