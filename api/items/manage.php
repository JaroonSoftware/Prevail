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

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");

        // var_dump($_POST);

        // ดึง seq ล่าสุด
        $sql_seq = "SELECT COUNT(stcode) as max_seq FROM items";
        $stmt_seq = $conn->prepare($sql_seq);
        $stmt_seq->execute();
        $row_seq = $stmt_seq->fetch(PDO::FETCH_ASSOC);
        $next_seq = ($row_seq['max_seq'] ?? 0) + 1;

        $sql = "INSERT INTO items (stcode, stname, stnameEN, typecode,unit,remark, price,buyprice,weight_stable, weight, vat,packing_weight,seq,created_by,created_date) 
        values (:stcode,:stname,:stnameEN,:typecode,:unit,:remark,:price,:buyprice,:weight_stable, :weight, :vat,:packing_weight,:seq,:action_user,:action_date)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");


        $stmt->bindParam(":stcode", $stcode, PDO::PARAM_STR);
        $stmt->bindParam(":stname", $stname, PDO::PARAM_STR);
        $stmt->bindParam(":stnameEN", $stnameEN, PDO::PARAM_STR);
        $stmt->bindParam(":typecode", $typecode, PDO::PARAM_STR);
        $stmt->bindParam(":unit", $unit, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $remark, PDO::PARAM_STR);
        $stmt->bindParam(":price", $price, PDO::PARAM_STR);
        $stmt->bindParam(":buyprice", $buyprice, PDO::PARAM_STR);
        $stmt->bindParam(":weight_stable", $weight_stable, PDO::PARAM_STR);
        $stmt->bindParam(":weight", $weight, PDO::PARAM_STR);
        $stmt->bindParam(":vat", $vat, PDO::PARAM_STR);
        $stmt->bindParam(":packing_weight", $packing_weight, PDO::PARAM_STR);
        $stmt->bindParam(":seq", $next_seq, PDO::PARAM_INT);
        $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "INSERT INTO items_stock (stcode,price,amtprice,qty,places,created_by,created_date) 
        values (:stcode,0,0,0,'1',:action_user,:action_date)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        
        $stmt->bindParam(":stcode", $stcode, PDO::PARAM_STR);
        $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }    

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("id" => "ok")));
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);

        $sql = "
        update items 
        set
        stname = :stname,
        stnameEN = :stnameEN,
        typecode = :typecode,
        unit = :unit,
        remark = :remark,
        price = :price,
        buyprice=:buyprice,        
        weight_stable=:weight_stable,
        weight=:weight,
        vat=:vat,
        packing_weight=:packing_weight,
        active_status = :active_status,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where stcode = :stcode";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");


        $stmt->bindParam(":stname", $stname, PDO::PARAM_STR);
        $stmt->bindParam(":stnameEN", $stnameEN, PDO::PARAM_STR);
        $stmt->bindParam(":typecode", $typecode, PDO::PARAM_STR);
        $stmt->bindParam(":unit", $unit, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $remark, PDO::PARAM_STR);
        $stmt->bindParam(":price", $price, PDO::PARAM_STR);        
        $stmt->bindParam(":buyprice", $buyprice, PDO::PARAM_STR);
        $stmt->bindParam(":weight_stable", $weight_stable, PDO::PARAM_STR);
        $stmt->bindParam(":weight", $weight, PDO::PARAM_STR);
        $stmt->bindParam(":vat", $vat, PDO::PARAM_STR);
        $stmt->bindParam(":packing_weight", $packing_weight, PDO::PARAM_STR);
        $stmt->bindParam(":active_status", $active_status, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":stcode", $stcode, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("id" => $_PUT)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = " SELECT a.* ";
        $sql .= " FROM `items` as a ";
        $sql .= " where stcode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql2 = "SELECT * FROM `items_img` ";
        $sql2 .= " where stcode = :code ";
        $stmt2 = $conn->prepare($sql2);
        if (!$stmt2->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }

        $dataFile = array();
        while ($row2 = $stmt2->fetch(PDO::FETCH_ASSOC)) {
            $dataFile[] = $row2;
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => $res,"file" => $dataFile));
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
