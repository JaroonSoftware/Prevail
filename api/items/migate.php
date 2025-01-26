<?php
header('Content-Type: application/json');
include_once('../conn.php');

$sql = "SELECT *
        FROM `items` 
        order by stcode asc";

$stmt = $conn->prepare($sql);
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);



foreach ($res as $ind => $val) {
    $val = (object)$val;
    // echo $val->stcode . '<br>';

    $sql = "INSERT INTO items_stock (stcode,price,amtprice,qty,places,created_by,created_date) 
        values (:stcode,0,0,0,'1','chayapat',:action_date)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");


    $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
    $stmt->bindParam(":action_date", date("Y-m-d H:i:s"), PDO::PARAM_STR);

    if (!$stmt->execute()) {
        $error = $conn->errorInfo();
        throw new PDOException("Insert data error => $error");
        die;
    }
}
