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
        // echo $blcode;
        $code = [];
        foreach ($_POST as $ind => $val) {
            $val = (object)$val;
            array_push($code,$val->blcode);
        }
        
        $sql = "SELECT a.blcode,a.bldate,a.deldate,a.cuscode,CONCAT(c.prename,' ',c.cusname) as cusname,CONCAT(COALESCE(c.idno, '') ,' ', COALESCE(c.road, ''),' ', COALESCE(c.subdistrict, ''),' ', COALESCE(c.district, ''),' ',COALESCE(c.zipcode, '') ) as address
        ,c.zipcode,c.contact,c.tel,c.fax,a.payment,a.total_price,a.discount,a.grand_total_price,a.remark ";
        $sql .= " FROM `bl_master` as a ";
        $sql .= " inner join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " where a.blcode in ('". implode("' , '", $code) . "')";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sql = "SELECT a.blcode,a.dncode,a.stcode, a.price, a.unit, a.qty ,i.stname ";
        $sql .= " FROM `bl_detail` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.blcode in ('". implode("' , '", $code) . "')";
        $sql .= " order by i.seq";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $header, "detail" => $detail)));
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
