<?php
/* ============================================================================
   เที่ยวรถ (สายส่ง) — api/trip/manage.php
   GET                       -> { trips: [{trip_id, trip_no, trip_name, customers:[{cuscode,cusname}]}],
                                  unassigned: [{cuscode,cusname}] }
   POST { trip_no, trip_name }                 -> เพิ่มเที่ยวรถ
   PUT  { trip_id, trip_no, trip_name }        -> แก้เลข/ชื่อเที่ยวรถ
   POST { action: "assign", trip_id, cuscodes } -> ผูกลูกค้าเข้าเที่ยวนี้ (ย้ายจากเที่ยวเดิมอัตโนมัติ)
   POST { action: "unassign", cuscode }        -> เอาลูกค้าออกจากเที่ยวรถ
   DELETE ?trip_id=                            -> ลบเที่ยวรถ (ลูกค้าในเที่ยวกลายเป็น "ยังไม่มีเที่ยว")
   ต้องรัน sql/2026-11-11_delivery_trip.sql ก่อน
   ============================================================================ */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");

$db = new DbConnect;
$conn = $db->connect();

function trip_json($data, int $code = 200): void
{
    if (ob_get_length()) ob_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

try {
    if (!$conn->query("SHOW TABLES LIKE 'delivery_trip'")->fetch()) {
        throw new Exception('ยังไม่มีตารางเที่ยวรถ — กรุณาให้ผู้ดูแลรัน sql/2026-11-11_delivery_trip.sql ก่อน');
    }
    $method = $_SERVER['REQUEST_METHOD'];
    $body = json_decode(file_get_contents('php://input') ?: '[]', true) ?: array();

    if ($method === 'GET') {
        $trips = $conn->query("SELECT trip_id, trip_no, trip_name FROM delivery_trip WHERE active_status = 'Y'
                               ORDER BY CAST(trip_no AS DECIMAL(8,2)), trip_no")->fetchAll(PDO::FETCH_ASSOC);
        $cus = $conn->query("SELECT cuscode, CONCAT(COALESCE(prename,''), ' ', COALESCE(cusname,'')) AS cusname, trip_id
                             FROM customer WHERE active_status = 'Y' ORDER BY cuscode")->fetchAll(PDO::FETCH_ASSOC);
        $by = array();
        $unassigned = array();
        $tripIds = array_flip(array_column($trips, 'trip_id'));
        foreach ($cus as $c) {
            $row = array('cuscode' => $c['cuscode'], 'cusname' => trim($c['cusname']));
            if ($c['trip_id'] !== null && isset($tripIds[$c['trip_id']])) $by[$c['trip_id']][] = $row;
            else $unassigned[] = $row;
        }
        foreach ($trips as &$t) $t['customers'] = $by[$t['trip_id']] ?? array();
        unset($t);
        trip_json(array('status' => 1, 'data' => array('trips' => $trips, 'unassigned' => $unassigned)));
    } elseif ($method === 'POST' && ($body['action'] ?? '') === 'assign') {
        $tripId = (int)($body['trip_id'] ?? 0);
        $codes = array_values(array_filter(array_map('strval', (array)($body['cuscodes'] ?? array()))));
        if ($tripId <= 0 || !$codes) throw new Exception('ต้องระบุเที่ยวรถและลูกค้า');
        $st = $conn->prepare("UPDATE customer SET trip_id = :t WHERE cuscode = :c");
        foreach ($codes as $c) $st->execute(array('t' => $tripId, 'c' => $c));
        trip_json(array('status' => 1));
    } elseif ($method === 'POST' && ($body['action'] ?? '') === 'unassign') {
        $c = (string)($body['cuscode'] ?? '');
        if ($c === '') throw new Exception('ต้องระบุลูกค้า');
        $conn->prepare("UPDATE customer SET trip_id = NULL WHERE cuscode = :c")->execute(array('c' => $c));
        trip_json(array('status' => 1));
    } elseif ($method === 'POST' || $method === 'PUT') {
        $no = trim((string)($body['trip_no'] ?? ''));
        $name = trim((string)($body['trip_name'] ?? ''));
        if ($no === '' || $name === '') throw new Exception('กรุณากรอกเลขเที่ยวและชื่อเที่ยวรถ');
        if (mb_strlen($no) > 10 || mb_strlen($name) > 150) throw new Exception('เลขเที่ยว/ชื่อเที่ยวรถยาวเกินไป');
        $id = (int)($body['trip_id'] ?? 0);
        $dup = $conn->prepare("SELECT trip_id FROM delivery_trip WHERE trip_no = :n AND trip_id <> :id");
        $dup->execute(array('n' => $no, 'id' => $id));
        if ($dup->fetchColumn()) throw new Exception("เลขเที่ยว $no มีอยู่แล้ว");
        if ($method === 'PUT') {
            if ($id <= 0) throw new Exception('ต้องระบุเที่ยวรถที่จะแก้');
            $conn->prepare("UPDATE delivery_trip SET trip_no = :n, trip_name = :m, active_status = 'Y', updated_date = NOW() WHERE trip_id = :id")
                ->execute(array('n' => $no, 'm' => $name, 'id' => $id));
        } else {
            $conn->prepare("INSERT INTO delivery_trip (trip_no, trip_name) VALUES (:n, :m)")->execute(array('n' => $no, 'm' => $name));
            $id = (int)$conn->lastInsertId();
        }
        trip_json(array('status' => 1, 'data' => array('trip_id' => $id)));
    } elseif ($method === 'DELETE') {
        $id = (int)($_GET['trip_id'] ?? 0);
        if ($id <= 0) throw new Exception('ต้องระบุเที่ยวรถ');
        $conn->beginTransaction();
        $conn->prepare("UPDATE customer SET trip_id = NULL WHERE trip_id = :id")->execute(array('id' => $id));
        $conn->prepare("DELETE FROM delivery_trip WHERE trip_id = :id")->execute(array('id' => $id));
        $conn->commit();
        trip_json(array('status' => 1));
    } else {
        throw new Exception('request method fail.');
    }
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    trip_json(array('status' => 0, 'message' => $e->getMessage()), 400);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
