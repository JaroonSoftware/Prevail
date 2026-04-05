<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/../onload.php");
http_response_code(400);

$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");

    $socode = !empty($socode) ? "and a.socode like '%$socode%'" : "";
    $cuscode = !empty($cuscode) ? "and c.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    $stcode = !empty($stcode) ? "and b.stcode like '%$stcode%'" : "";
    $stname = !empty($stname) ? "and i.stname like '%$stname%'" : "";
    $sodate = "";

    if (!empty($sodate_form) && !empty($sodate_to)) {
        $sodate = "and date_format(a.sodate, '%Y-%m-%d') >= '$sodate_form' and date_format(a.sodate, '%Y-%m-%d') <= '$sodate_to'";
    }

    try {
        $sql = "
        SELECT
            a.socode,
            a.sodate,
            a.cuscode,
            c.cusname,
            b.stcode,
            i.stname,
            b.qty,
            b.price,
            b.unit,
            IFNULL(b.vat, IFNULL(i.vat, 0)) AS vat,
            a.remark,
            a.deldate,
            (IFNULL(b.qty, 0) * IFNULL(b.price, 0)) AS line_subtotal,
            ((IFNULL(b.qty, 0) * IFNULL(b.price, 0)) * (1 + (IFNULL(b.vat, IFNULL(i.vat, 0)) / 100))) AS line_net_total
        FROM somaster a
        LEFT JOIN sodetail b ON a.socode = b.socode
        LEFT JOIN items i ON b.stcode = i.stcode
        LEFT JOIN customer c ON a.cuscode = c.cuscode
        WHERE 1 = 1
        $socode
        $cuscode
        $cusname
        $stcode
        $stname
        $sodate
        ORDER BY i.stname ASC, b.stcode ASC, a.sodate ASC, a.socode ASC;";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data" => $res));
    } catch (mysqli_sql_exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally {
        $conn = null;
    }
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

ob_end_flush();
exit;
?>