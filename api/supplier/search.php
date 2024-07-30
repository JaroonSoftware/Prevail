<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");


    $supcode = !empty($supcode) ? "and a.supcode like '%$supcode%'" : "";
    $supname = !empty($supname) ? "and a.supname like '%$supname%'" : "";
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

    try {
        $sql = "SELECT a.supcode,a.prename, a.supname,a.tel,a.contact,a.fax,a.taxnumber,a.email,a.idno,a.road,a.subdistrict,a.district,a.province,a.zipcode,
        a.road, a.active_status FROM `supplier` as a    
        where 1 = 1    
        $supcode
        $supname
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
