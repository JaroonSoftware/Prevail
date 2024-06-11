<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");
        $action_date = date("Y-m-d H:i:s"); 
        $action_user = $token->userid;

        $code = request_pilotscale_code($conn);
        // var_dump($_POST);
        $sql = "insert pilotscale 
        (pilotscale_code,spcode,fgcode,productcode,created_date,created_by,updated_date,updated_by,remark,batchsize) 
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        $status = "Y"; 
        $stmt->bindParam(1, $code, PDO::PARAM_STR);
        $stmt->bindValue(2, $header->spcode, PDO::PARAM_STR);
        $stmt->bindValue(3, $header->fgcode, PDO::PARAM_STR);
        $stmt->bindValue(4, $header->productcode, PDO::PARAM_STR); 
        $stmt->bindValue(5, $action_date, PDO::PARAM_STR);
        $stmt->bindValue(6, $action_user, PDO::PARAM_INT);
        $stmt->bindValue(7, $action_date, PDO::PARAM_STR);
        $stmt->bindValue(8, $action_user, PDO::PARAM_INT);
        $stmt->bindValue(9, $header->remark, PDO::PARAM_STR);
        $stmt->bindValue(10, $header->batchsize, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 

        update_pilotscale_code($conn);
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");
        $action_date = date("Y-m-d");
        $action_time = date("H:i:s");
        $action_user = $token->userid;

        // var_dump($_POST);
        $sql = "
        update pilotscale
        set
        spcode = :spcode,
        fgcode = :fgcode,
        productcode = :productcode,
        remark = :remark,
        batchsize = :batchsize,
        updated_date = :action_date, 
        updated_by = :action_user
        where pilotscale_code = :pilotscale_code";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        // $master->srstatus = "Y"; 
        $stmt->bindParam(":spcode", $header->spcode, PDO::PARAM_STR);
        $stmt->bindValue(":fgcode", $header->fgcode, PDO::PARAM_STR); 
        $stmt->bindValue(":productcode", $header->productcode, PDO::PARAM_STR);
        $stmt->bindValue(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindValue(":action_date", $action_date, PDO::PARAM_STR); 
        $stmt->bindValue(":action_user", $action_user, PDO::PARAM_INT); 
        $stmt->bindValue(":batchsize", $header->batchsize, PDO::PARAM_STR);
        $stmt->bindValue(":pilotscale_code", $header->pilotscale_code, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from pilotscale where pilotscale_code = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"];
        $sql = " select s.* from pilotscale s where s.pilotscale_code = :code"; 
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> $res));
    }

} catch (PDOException $e) { 
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) { 
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally{
    $conn = null;
}  
ob_end_flush(); 
exit;