<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect();

try {
    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $dncode = isset($_GET["dncode"]) ? trim($_GET["dncode"]) : "";
        if (empty($dncode)) {
            throw new Exception("dncode is required");
        }

        $sql = "SELECT DISTINCT a.blcode, b.bldate, b.cuscode, b.payment, b.duedate, b.total_price, b.discount, b.remark, b.doc_status, b.active_status, a.dncode"
             . " FROM bl_detail a"
             . " INNER JOIN bl_master b ON a.blcode = b.blcode"
             . " WHERE a.dncode = :dncode AND b.active_status = 'Y'"
             . " ORDER BY a.blcode DESC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            $error = $conn->errorInfo();
            throw new Exception("Prepare statement error => " . print_r($error, true));
        }

        if (!$stmt->execute(['dncode' => $dncode])) {
            $error = $conn->errorInfo();
            throw new Exception("Query execute error => " . print_r($error, true));
        }

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => $data));
    } else {
        http_response_code(400);
        echo json_encode(array('status' => 0, 'message' => 'request method fail.'));
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(array('status' => 0, 'message' => $e->getMessage()));
} finally {
    $conn = null;
}
ob_end_flush();
exit;
