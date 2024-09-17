<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");


    $catalog_code = !empty($catalog_code) ? "and a.catalog_code like '%$catalog_code%'" : "";
    $catalog_name = !empty($catalog_name) ? "and a.catalog_name like '%$catalog_name%'" : "";

    try {
        $sql = "SELECT a.catalog_code, a.catalog_name,a.active_status FROM `catalog_master` as a
        where 1 = 1
        $catalog_code
        $catalog_name
        order by a.created_date desc";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data" => $res,));
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
