<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");


    /* ใช้ parameter แทนการต่อสตริง (กัน SQL injection) */
    $where = array();
    $params = array();
    if (!empty($catalog_code)) { $where[] = "a.catalog_code LIKE :cc"; $params['cc'] = '%' . $catalog_code . '%'; }
    if (!empty($catalog_name)) { $where[] = "a.catalog_name LIKE :cn"; $params['cn'] = '%' . $catalog_name . '%'; }
    if (!empty($active_status) && $active_status !== "ALL") { $where[] = "a.active_status = :st"; $params['st'] = $active_status; }
    /* ค้นหาจากลูกค้าที่ผูกกับแคตตาล็อก */
    if (!empty($cuscode)) {
        $where[] = "EXISTS (SELECT 1 FROM catalog_link l WHERE l.catalog_code = a.catalog_code AND l.cuscode LIKE :cus)";
        $params['cus'] = '%' . $cuscode . '%';
    }
    if (!empty($cusname)) {
        $where[] = "EXISTS (SELECT 1 FROM catalog_link l JOIN customer c ON c.cuscode = l.cuscode
                            WHERE l.catalog_code = a.catalog_code AND CONCAT(COALESCE(c.prename,''), ' ', COALESCE(c.cusname,'')) LIKE :cusn)";
        $params['cusn'] = '%' . $cusname . '%';
    }

    try {
        $sql = "SELECT a.catalog_code, a.catalog_name, a.active_status,
                       (SELECT GROUP_CONCAT(l.cuscode ORDER BY l.cuscode SEPARATOR ', ') FROM catalog_link l WHERE l.catalog_code = a.catalog_code) AS customers
        FROM `catalog_master` as a
        where 1 = 1 " . ($where ? " AND " . implode(" AND ", $where) : "") . "
        order by a.catalog_code desc";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
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
