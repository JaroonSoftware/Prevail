<?php
/* ============================================================================
   Dashboard: ลูกค้าที่ "รับแจ้งเตือนรายงานทุกวัน" (customer.daily_alert = 'Y')
   ออกใบขายสินค้าสำหรับวันที่นัดส่ง :date แล้วหรือยัง
   GET ?date=YYYY-MM-DD   (ไม่ส่ง = วันนี้)
   คืน: [{cuscode, cusname, county_name, trip, so_count, draft_count, socodes, status}]
     status: none = ยังไม่ออกใบขาย | draft = มีแต่ใบรอยืนยัน (AI) | done = ออกแล้ว
   ต้องรัน sql/2026-11-18_customer_daily_alert.sql ก่อน
   ============================================================================ */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");

function dd_json($data, int $code = 200): void
{
    if (ob_get_length()) ob_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

$conn = null;
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') throw new Exception('request method fail.');
    $conn = (new DbConnect)->connect();
    if (!$conn->query("SHOW COLUMNS FROM customer LIKE 'daily_alert'")->fetch()) {
        throw new Exception('ยังไม่มีข้อมูลลูกค้ารับแจ้งเตือน กรุณาให้ผู้ดูแลรัน sql/2026-11-18_customer_daily_alert.sql');
    }
    $date = (string)($_GET['date'] ?? date('Y-m-d'));
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) throw new Exception('วันที่ไม่ถูกต้อง');

    $hasTrip = (bool)$conn->query("SHOW TABLES LIKE 'delivery_trip'")->fetch()
        && (bool)$conn->query("SHOW COLUMNS FROM customer LIKE 'trip_id'")->fetch();

    $sql = "SELECT c.cuscode, TRIM(CONCAT(COALESCE(c.prename,''), ' ', COALESCE(c.cusname,''))) AS cusname,
                   ct.county_name, " . ($hasTrip ? "CONCAT(t.trip_no, '.', t.trip_name)" : "NULL") . " AS trip,
                   SUM(CASE WHEN s.socode IS NOT NULL AND s.doc_status <> 'รอยืนยันใบขายสินค้า' THEN 1 ELSE 0 END) AS so_count,
                   SUM(CASE WHEN s.doc_status = 'รอยืนยันใบขายสินค้า' THEN 1 ELSE 0 END) AS draft_count,
                   GROUP_CONCAT(s.socode ORDER BY s.socode SEPARATOR ', ') AS socodes,
                   /* PO ลูกค้าที่ออกใบขายแล้ว (เลข PO ซ้ำนับเป็นใบเดียว) */
                   COUNT(DISTINCT NULLIF(TRIM(s.customer_po), '')) AS po_count,
                   GROUP_CONCAT(DISTINCT NULLIF(TRIM(s.customer_po), '') ORDER BY TRIM(s.customer_po) SEPARATOR ', ') AS po_list,
                   /* คู่ PO=ใบขาย สำหรับแสดงเลข PO และลิงก์ไปใบขาย */
                   GROUP_CONCAT(CONCAT(COALESCE(NULLIF(TRIM(s.customer_po), ''), ''), '=', s.socode) ORDER BY TRIM(s.customer_po), s.socode SEPARATOR '|') AS po_pairs
            FROM customer c
            LEFT JOIN county ct ON ct.county_code = c.county_code
            " . ($hasTrip ? "LEFT JOIN delivery_trip t ON t.trip_id = c.trip_id" : "") . "
            LEFT JOIN somaster s ON s.cuscode = c.cuscode AND DATE(s.deldate) = :d
                 AND COALESCE(s.doc_status, '') <> 'ยกเลิก' AND COALESCE(s.active_status, 'Y') <> 'N'
            WHERE c.daily_alert = 'Y' AND COALESCE(c.active_status, 'Y') = 'Y'
            GROUP BY c.cuscode, c.prename, c.cusname, ct.county_name" . ($hasTrip ? ", t.trip_no, t.trip_name" : "") . "
            ORDER BY c.cuscode";
    $st = $conn->prepare($sql);
    $st->execute(array('d' => $date));
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['so_count'] = (int)$r['so_count'];
        $r['draft_count'] = (int)$r['draft_count'];
        $r['po_count'] = (int)$r['po_count'];
        $r['status'] = $r['so_count'] > 0 ? 'done' : ($r['draft_count'] > 0 ? 'draft' : 'none');
    }
    unset($r);
    dd_json(array('status' => 1, 'date' => $date, 'data' => $rows));
} catch (Throwable $e) {
    dd_json(array('status' => 0, 'message' => $e->getMessage()), 400);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
