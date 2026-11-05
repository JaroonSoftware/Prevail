<?php
// Read-only sales history, using the same delivery-note source as existing sales reports.
include_once(dirname(__FILE__, 3) . '/onload.php');
header('Content-Type: application/json; charset=utf-8');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) throw new InvalidArgumentException('รูปแบบคำค้นหาไม่ถูกต้อง');
    $params = [];
    foreach (['date_from', 'date_to'] as $name) {
        $value = $input[$name] ?? '';
        if (!is_string($value)) throw new InvalidArgumentException('กรุณาระบุช่วงวันที่');
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) throw new InvalidArgumentException('วันที่ไม่ถูกต้อง');
        $params[$name] = $value;
    }
    if ($params['date_from'] > $params['date_to']) throw new InvalidArgumentException('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
    $params['date_until'] = (new DateTimeImmutable($params['date_to']))->modify('+1 day')->format('Y-m-d');
    unset($params['date_to']);
    $where = ["a.doc_status <> 'ยกเลิก'", 'a.dndate >= :date_from', 'a.dndate < :date_until'];
    foreach (['customer' => 'a.cuscode', 'item' => 'b.stcode'] as $prefix => $column) {
        foreach (['from' => '>=', 'to' => '<='] as $suffix => $operator) {
            $key = $prefix . '_' . $suffix;
            $value = $input[$key] ?? '';
            if (!is_string($value) || strlen($value) > 160) throw new InvalidArgumentException('รหัสค้นหาไม่ถูกต้อง');
            $value = trim($value);
            if ($value !== '') { $params[$key] = $value; $where[] = "$column $operator :$key"; }
        }
    }
    $conn = (new DbConnect)->connect();
    $sql = "SELECT b.code AS detail_code, a.dncode, a.dndate, a.cuscode,
        COALESCE(c.cusname, a.cuscode) AS cusname, b.socode, b.stcode,
        COALESCE(i.stname, b.stcode) AS stname, i.stnameEN, b.qty, b.price, b.unit,
        COALESCE(i.vat, 0) AS vat, a.remark,
        ROUND(COALESCE(b.qty,0) * COALESCE(b.price,0), 2) AS line_subtotal,
        ROUND(COALESCE(b.qty,0) * COALESCE(b.price,0) * (1 + COALESCE(i.vat,0)/100), 2) AS line_net_total
        FROM dnmaster a JOIN dndetail b ON b.dncode = a.dncode
        LEFT JOIN customer c ON c.cuscode = a.cuscode
        LEFT JOIN items i ON i.stcode = b.stcode
        WHERE " . implode(' AND ', $where) . "
        ORDER BY a.cuscode, b.stcode, b.unit, a.dndate, a.dncode, b.code LIMIT 10001";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($rows) > 10000) {
        http_response_code(422);
        echo json_encode(['message' => 'รายการเกิน 10,000 บรรทัด กรุณาลดช่วงวันที่หรือลูกค้า โดยระบบยังไม่แสดงรายงานที่ไม่ครบ'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['data' => $rows, 'generated_at' => date('c')], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Sales history report: ' . $e->getMessage());
    echo json_encode(['message' => 'โหลดรายงานไม่สำเร็จ กรุณาลองใหม่'], JSON_UNESCAPED_UNICODE);
}
