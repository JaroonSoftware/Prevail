<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/../onload.php");

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

        // var_dump($_POST);
        $record_date = date("Y-m-d");

        if ($qty_stock - $qty_book > 0) {
            $sql = "INSERT INTO drygoods_book (stcode,qty,book_date) 
            values (:stcode,:qty,:record_date)";

            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt->bindParam(":stcode", $stcode, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $qty_stock, PDO::PARAM_STR);
            $stmt->bindParam(":record_date", $record_date, PDO::PARAM_STR);

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
        }
        // ดึง seq ล่าสุด
        $sql = "INSERT INTO drygoods_record (socode,stcode, stname, qty,record_date,created_by,created_date) 
        values (:socode,:stcode,:stname,:qty,:record_date,:action_user,:action_date)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt->bindParam(":socode", $socode, PDO::PARAM_STR);
        $stmt->bindParam(":stcode", $stcode, PDO::PARAM_STR);
        $stmt->bindParam(":stname", $stname, PDO::PARAM_STR);
        $stmt->bindParam(":qty", $qty_result, PDO::PARAM_STR);
        $stmt->bindParam(":record_date", $record_date, PDO::PARAM_STR);
        $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'message' => $stname . ' บันทึกเรียบร้อยแล้ว'));
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
