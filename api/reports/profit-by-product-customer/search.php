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

    $socode = !empty($socode) ? "and b.socode like '%$socode%'" : "";
    $cuscode = !empty($cuscode) ? "and c.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    $stcode = !empty($stcode) ? "and b.stcode like '%$stcode%'" : "";
    $stname = !empty($stname) ? "and i.stname like '%$stname%'" : "";
    $dndate = "";

    if (!empty($dndate_form) && !empty($dndate_to)) {
        $dndate = "and date_format(a.dndate, '%Y-%m-%d') >= '$dndate_form' and date_format(a.dndate, '%Y-%m-%d') <= '$dndate_to'";
    }

    try {
        $sql = "
        SELECT
            a.dncode,
            b.socode,
            a.dndate,
            a.cuscode,
            c.cusname,
            b.stcode,
            i.stname,
            b.qty,
            b.price,
            COALESCE(sd.unit, b.unit, i.unit) AS unit,
            IFNULL(sd.vat, IFNULL(i.vat, 0)) AS vat,
            IFNULL(i.buyprice, 0) AS buyprice,
            IFNULL(sd.total_cost, 0) AS total_cost,
            (IFNULL(b.qty, 0) * IFNULL(b.price, 0)) AS line_subtotal,
            ((IFNULL(b.qty, 0) * IFNULL(b.price, 0)) * (1 + (IFNULL(sd.vat, IFNULL(i.vat, 0)) / 100))) AS line_net_total,
            IFNULL(
                NULLIF(
                    CASE
                        WHEN IFNULL(sd.delamount, 0) > 0 THEN (IFNULL(sd.total_cost, 0) / sd.delamount) * IFNULL(b.qty, 0)
                        ELSE 0
                    END,
                    0
                ),
                (IFNULL(b.qty, 0) * IFNULL(i.buyprice, 0))
            ) AS line_cost_total,
            (
                ((IFNULL(b.qty, 0) * IFNULL(b.price, 0)) * (1 + (IFNULL(sd.vat, IFNULL(i.vat, 0)) / 100))) -
                IFNULL(
                    NULLIF(
                        CASE
                            WHEN IFNULL(sd.delamount, 0) > 0 THEN (IFNULL(sd.total_cost, 0) / sd.delamount) * IFNULL(b.qty, 0)
                            ELSE 0
                        END,
                        0
                    ),
                    (IFNULL(b.qty, 0) * IFNULL(i.buyprice, 0))
                )
            ) AS line_profit_total
        FROM dnmaster a
        LEFT JOIN dndetail b ON a.dncode = b.dncode
        LEFT JOIN sodetail sd ON b.socode = sd.socode AND b.stcode = sd.stcode
        LEFT JOIN items i ON b.stcode = i.stcode
        LEFT JOIN customer c ON a.cuscode = c.cuscode
        WHERE 1 = 1
        AND a.issue_status = 'ตัดสต๊อกแล้ว'
        AND a.doc_status != 'ยกเลิก'
        $socode
        $cuscode
        $cusname
        $stcode
        $stname
        $dndate
        ORDER BY i.stname ASC, b.stcode ASC, c.cusname ASC, c.cuscode ASC, a.dndate ASC, b.socode ASC, a.dncode ASC;";

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