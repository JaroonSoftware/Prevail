<?php
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    extract($_GET, EXTR_OVERWRITE, "_");
    // $type_code = !empty($type) ? "and i.typecode = '$type'" : "";
    try {
        $sql = "
			SELECT a.code,a.socode, a.stcode,i.stname, a.qty, a.price,a.unit,IF(a.delamount IS NULL,0,a.delamount) as delamount
            FROM sodetail a 
            inner join somaster b on (a.socode=b.socode)
            inner join items i on (a.stcode=i.stcode)
            where b.cuscode= '$cuscode' and IF(a.delamount IS NULL,0,a.delamount) < a.qty and b.doc_status != 'ยกเลิก' ";
            $sql .= " order by i.seq";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data" => $res));
    } catch (mysqli_sql_exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally {
        // Ignore

    }
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
