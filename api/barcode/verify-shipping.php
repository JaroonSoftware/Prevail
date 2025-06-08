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

    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = " SELECT a.* ";
        $sql .= " FROM `package_barcode` as a ";
        $sql .= " where package_id = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => $res));
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);
        $sql = "
        update package_barcode 
        set
        doc_status = 'ขายแล้ว',
        socode = :socode,
        dncode = :dncode,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where package_id = :package_id";

        // package_id = 'อยู่ในสต๊อก',

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":socode", $header->socode, PDO::PARAM_STR);
        $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":package_id", $header->package_id, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "
        update dndetail 
        set
        del_qty = del_qty+:weight
        where dncode = :dncode and stcode = :stcode ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
        $stmt->bindParam(":stcode", $header->stcode, PDO::PARAM_STR);
        $stmt->bindParam(":weight", $header->weight, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "
            update items_stock 
            set
            qty = qty-:weight
            where stcode = :stcode ";

            $stmt5 = $conn->prepare($sql);
            if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt5->bindParam(":stcode", $header->stcode, PDO::PARAM_STR);
            $stmt5->bindParam(":weight", $header->weight, PDO::PARAM_STR);

            if (!$stmt5->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

        $sql = "
        update dnmaster
        set
        doc_status = 'จัดเตรียมสินค้ายังไม่ครบ'
        where dncode = :dncode  ";

        $stmt1 = $conn->prepare($sql);
        if (!$stmt1) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt1->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);

        if (!$stmt1->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $strSQL = "SELECT count(code) as count FROM `dndetail` where dncode = :dncode and qty>del_qty ";
        $stmt5 = $conn->prepare($strSQL);
        if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt5->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);

        if (!$stmt5->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $res = $stmt5->fetch(PDO::FETCH_ASSOC);
        extract($res, EXTR_OVERWRITE, "_");
        if ($count == 0) {

            $sql = "
                update somaster 
                set
                doc_status = 'รอออกใบวางบิล',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where socode = :socode";

            $stmt4 = $conn->prepare($sql);
            if (!$stmt4) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt4->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt4->bindParam(":socode", $header->socode, PDO::PARAM_STR);

            if (!$stmt4->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $sql = "
                update dnmaster 
                set
                doc_status = 'จัดเตรียมสินค้าแล้ว',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where dncode = :dncode";

            $stmt4 = $conn->prepare($sql);
            if (!$stmt4) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt4->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt4->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);

            if (!$stmt4->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }            
        }

        


        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $header->barcode_id)));
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
