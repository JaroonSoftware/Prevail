<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");


    $stcode = !empty($stcode) ? "and a.stcode like '%$stcode%'" : "";
    $stname = !empty($stname) ? "and a.stname like '%$stname%'" : "";
    $typecode = !empty($typecode) ? "and a.typecode like '%$typecode%'" : "";
    try {
        $sql = "SELECT a.stcode, a.stname, b.typename, a.price ,a.active_status FROM `items` as a
        left outer join `itemtype` as b on (a.typecode=b.typecode)   
        where 1 = 1   
        $stcode
        $stname
        $typecode
        order by a.created_date desc";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data" => $res));
        // echo json_encode(array("data" => $res,"sql" => $sql));
    } catch (mysqli_sql_exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
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
