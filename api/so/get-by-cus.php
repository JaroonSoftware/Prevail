<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try { if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = "SELECT a.socode,a.sodate,a.deldate,a.doc_status,a.total_price ";
        $sql .= " FROM `somaster` as a ";
        $sql .= " where a.cuscode = :code and a.doc_status <> 'รอยืนยันใบขายสินค้า' ";

        $params = ['code' => $code];
        /* ?month=YYYY-MM : เฉพาะใบขายเดือนนั้น (ไม่รวมที่ยกเลิก) ใช้ตอนเพิ่มรายการเพิ่มเติมในใบส่งของ */
        if (!empty($_GET['month']) && preg_match('/^\d{4}-\d{2}$/', $_GET['month'])) {
            $sql = str_replace("SELECT a.socode,", "SELECT (SELECT GROUP_CONCAT(DISTINCT d.stcode SEPARATOR ',') FROM sodetail d WHERE d.socode = a.socode) AS stcodes, a.socode,", $sql);
            $sql .= " and a.doc_status <> 'ยกเลิก' and a.sodate >= :m1 and a.sodate < DATE_ADD(:m2, INTERVAL 1 MONTH) ";
            $sql .= " order by a.sodate desc, CHAR_LENGTH(a.socode) desc, a.socode desc ";
            $params['m1'] = $_GET['month'] . '-01';
            $params['m2'] = $_GET['month'] . '-01';
        }
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute($params)) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => $data));
    }
} catch (PDOException $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally {
    $conn = null;
}
ob_end_flush();
exit;
