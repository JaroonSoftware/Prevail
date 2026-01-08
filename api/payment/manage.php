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

        // var_dump($_POST);
        $sql = "insert receipt_payment (`paydate`,recode, `paid_amount`, `payment_type`,
        `bank_code`,`bank_name`,branch,reference_no,remark,created_by,updated_by) 
        values (:paydate,:recode,:paid_amount,:payment_type,
        :bank_code,:bank_name,:branch,:reference_no,:remark,:action_user,:action_user)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $res = (object)$res;
        $stmt->bindParam(":recode", $res->recode, PDO::PARAM_STR);
        $stmt->bindParam(":paydate", $res->paydate, PDO::PARAM_STR);
        $stmt->bindParam(":paid_amount", $res->paid_amount, PDO::PARAM_STR);
        $stmt->bindParam(":payment_type", $res->payment_type, PDO::PARAM_STR);
        $stmt->bindParam(":bank_code", $res->bank_code, PDO::PARAM_STR);
        $stmt->bindParam(":bank_name", $res->bank_name, PDO::PARAM_STR);
        $stmt->bindParam(":branch", $res->branch, PDO::PARAM_STR);
        $stmt->bindParam(":reference_no", $res->reference_no, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $res->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "
            update receipt 
            set
            total_paid = total_paid + :paid_amount,
            doc_status = CASE 
                WHEN (total_paid + :paid_amount) >= grand_total_price THEN 'ชำระเงินครบแล้ว' 
                ELSE 'ชำระเงินไม่ครบ' 
            END,
            updated_date = CURRENT_TIMESTAMP(),
            updated_by = :action_user
            where recode = :recode";

        $stmt2 = $conn->prepare($sql);
        if (!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt2->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt2->bindParam(":paid_amount", $res->paid_amount, PDO::PARAM_STR);
        $stmt2->bindParam(":recode", $res->recode, PDO::PARAM_STR);

        if (!$stmt2->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);
        $sql = "
        update receipt_payment 
        set
        redate = :redate,
        cuscode = :cuscode,
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where recode = :recode";


        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":redate", $header->redate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":recode", $header->recode, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
        // $code = $_DELETE["code"];
        $code = $_GET["code"];

        $sql = "delete from receipt_payment where code = :code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status" => 1));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = "SELECT a.*,c.* ";
        $sql .= " FROM `receipt_payment` ";
        $sql .= " where a.recode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $header)));
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
