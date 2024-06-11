<?php
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 1);
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Headers: *");
// header("Access-Control-Allow-Methods: *");

include '../conn.php';

$sql = "SELECT supcode,supname,`type`,idno,road,subdistrict,district,province,zipcode,tel,fax,taxnumber,email,status as statussup FROM `supplier` ";
$sql .= " where supcode = '" . $_POST['idcode'] . "'";
$stmt = $conn->prepare($sql);
$stmt->execute();
$data = $stmt->fetch(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($data);