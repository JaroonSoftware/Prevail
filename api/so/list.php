<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_date = date("Y-m-d H:i:s");
    $action_user = $token->userid;
    // echo $action_user;

        
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");
        // echo $ivcode;
        $code = [];
        foreach ($_POST as $ind => $val) {
            $val = (object)$val;
            array_push($code,$val->socode);
        }

        $sql = "SELECT b.code,a.socode,d.dncode,b.qty,i.stcode,i.stname,b.price,b.unit,b.vat,c.cuscode, c.cusname,c.prename, c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,a.doc_status
            FROM somaster as a 
            inner join `sodetail` as b on (a.socode=b.socode)
            inner join `dndetail` as d on (a.socode=b.socode) and (b.stcode=d.stcode)
            inner join `items` as i on (b.stcode=i.stcode)
            inner join `customer` as c on (a.cuscode=c.cuscode) 
            where a.socode in ('". implode("' , '", $code) . "')
            group by a.socode,i.stcode";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $sql, "detail" => $detail)));
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
