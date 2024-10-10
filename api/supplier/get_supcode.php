<?php
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 1);

include '../conn.php';

$sql = "SELECT number as supcode FROM `supcode` ";
// $sql .= " where prodty_id = '".$_GET['id']."'";
$stmt = $conn->prepare($sql);
$stmt->execute();
$res = $stmt->fetch(PDO::FETCH_ASSOC);
extract($res, EXTR_OVERWRITE, "_");

// $code = "S".sprintf("%06s", ($supcode));
$code = sprintf("S%06s", ( intval($supcode) + 1) );

http_response_code(200);
echo json_encode($code);


