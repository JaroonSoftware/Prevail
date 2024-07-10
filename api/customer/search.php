<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");


    $cuscode = !empty($cuscode) ? "and a.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and a.cusname like '%$cusname%'" : "";
    $prename = !empty($prename) ? "and a.prename like '%$prename%'" : "";
    $tel = !empty($tel) ? "and a.tel like '%$tel%'" : "";
    $contact = !empty($contack) ? "and a.contack like '%$contack%'" : "";
    $fax = !empty($fax) ? "and a.fax like '%$fax%'" : "";
    $taxnumber = !empty($taxnumber) ? "and a.taxnumber like '%$taxnumber%'" : "";
    $email = !empty($email) ? "and a.email like '%$email%'" : "";
    $active_status = !empty($active_status) ? "and a.active_status like '%$active_status%'" : "";
    $idno = !empty($idno) ? "and a.idno like '%$idno%'" : "";
    $road = !empty($road) ? "and a.road like '%$road%'" : "";
    $subdistrict = !empty($subdistrict) ? "and a.subdistrict like '%$subdistrict%'" : "";
    $district = !empty($district) ? "and a.district like '%$district%'" : "";
    $province = !empty($province) ? "and a.province like '%$province%'" : "";
    $zipcode = !empty($zipcode) ? "and a.zipcode like '%$zipcode%'" : "";
    $delidno = !empty($delidno) ? "and a.delidno like '%$delidno%'" : "";
    $delroad = !empty($delroad) ? "and a.delroad like '%$delroad%'" : "";
    $delsubdistrict = !empty($delsubdistrict) ? "and a.delsubdistrict like '%$delsubdistrict%'" : "";
    $deldistrict = !empty($deldistrict) ? "and a.deldistrict like '%$deldistrict%'" : "";
    $delprovince = !empty($delprovince) ? "and a.delprovince like '%$delprovince%'" : "";
    $delzipcode = !empty($delzipcode) ? "and a.delzipcode like '%$delzipcode%'" : "";
    try {
        $sql = "SELECT a.cuscode,a.prename, a.cusname,a.tel,a.contact,a.fax,a.taxnumber,a.email,a.idno,a.road,a.subdistrict,a.district,a.province,a.zipcode,a.delidno,
        a.road,a.delsubdistrict,a.deldistrict,a.delprovince,a.delzipcode, a.active_status FROM `customer` as a    
        where 1 = 1    
        $cuscode
        $cusname
        $tel
        $province
        order by a.created_date desc";
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
        $conn = null;
    }
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}
ob_end_flush();
exit;
