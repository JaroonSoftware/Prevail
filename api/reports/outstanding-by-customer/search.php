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

    $cuscode = !empty($cuscode) ? "and a.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    $bldate = "";

    if (!empty($bldate_form) && !empty($bldate_to)) {
        $bldate = "and date_format(a.bldate, '%Y-%m-%d') >= '$bldate_form' and date_format(a.bldate, '%Y-%m-%d') <= '$bldate_to'";
    }

    try {
        $sql = "
        SELECT
            a.blcode,
            a.bldate,
            a.duedate,
            a.cuscode,
            c.cusname,
            a.total_price,
            a.discount,
            (IFNULL(a.total_price, 0) - IFNULL(a.discount, 0)) AS grand_total_price,
            a.doc_status
        FROM bl_master a
        LEFT JOIN customer c ON a.cuscode = c.cuscode
        WHERE a.active_status <> 'N'
        AND a.doc_status = 'รอออกใบเสร็จรับเงิน'
        $cuscode
        $cusname
        $bldate
        ORDER BY c.cusname ASC, a.cuscode ASC, a.bldate ASC;";

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
