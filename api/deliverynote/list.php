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
            array_push($code,$val->dncode);
        }
        
        // $sql = "SELECT b.code,d.dncode,d.socode,d.dndate,i.stcode,i.stname,s.price,s.unit,IF(i.weight_stable='N', sum(b.unit_weight), count(b.code) ) qty,i.vat,s.discount,c.cuscode, c.cusname,c.prename, c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,d.doc_status
        //     FROM dnmaster as d 
        //     inner join `dndetail` as b on (d.dncode=b.dncode)
        //     inner join `sodetail` as s on (d.socode=s.socode and s.stcode=b.stcode)
        //     inner join `items` as i on (b.stcode=i.stcode)
        //     inner join `customer` as c on (d.cuscode=c.cuscode) 
        //     where d.dncode in ('". implode("' , '", $code) . "')";

        // $stmt = $conn->prepare($sql);
        // if (!$stmt->execute()) {
        //     $error = $conn->errorInfo();
        //     http_response_code(404);
        //     throw new PDOException("Geting data error => $error");
        // }
        // $header = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sql = "SELECT b.code,d.dncode,b.qty,i.stcode,i.stname,s.price,s.unit,i.vat,c.cuscode, c.cusname,c.prename, c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,d.doc_status
            FROM dnmaster as d 
            inner join `dndetail` as b on (d.dncode=b.dncode)
            inner join `sodetail` as s on (b.socode=s.socode and s.stcode=b.stcode)
            inner join `items` as i on (b.stcode=i.stcode)
            inner join `customer` as c on (d.cuscode=c.cuscode) 
            where d.dncode in ('". implode("' , '", $code) . "')
            group by b.dncode,i.stcode";
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
