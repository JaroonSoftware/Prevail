<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_datetime = date("Y-m-d H:i:s");
    $action_username = $token->userid; 
    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");

        $sql = "select 1 r from pktype where pktype = :v";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'v' => $pktype ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        if ($stmt->rowCount() > 0) throw new PDOException("Packaing Type is duplicate");     
        
        // var_dump($_POST);
        $sql = "insert pktype (pktype,status,created_date,created_by,updated_date,updated_by) values (?, ?, CURRENT_TIMESTAMP(), ?, CURRENT_TIMESTAMP(), ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
 
        $stmt->bindParam( 1, $pktype, PDO::PARAM_STR);
        $stmt->bindValue( 2, $status, PDO::PARAM_STR);
        $stmt->bindValue( 3, $action_username, PDO::PARAM_INT);
        $stmt->bindValue( 4, $action_username, PDO::PARAM_INT);
        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error"); 
        }   

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $master->srcode)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");

        $sql = "select 1 r from pktype where pktype = :v and id <> :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'v' => $pktype, 'id' => $id ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        if ($stmt->rowCount() > 0) throw new PDOException("Packaing Type is duplicate");     

        // var_dump($_POST);
        $sql = "
        update pktype
        set
        pktype = :pktype,
        status = :status, 
        updated_date = CURRENT_TIMESTAMP(), 
        updated_by = :action_user
        where id = :id";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        // $master->srstatus = "Y"; 
        $stmt->bindParam(":pktype", $pktype, PDO::PARAM_STR);
        $stmt->bindValue(":status", $status, PDO::PARAM_STR);  
        $stmt->bindValue(":action_user", $action_username, PDO::PARAM_INT);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $_PUT)));

    } else if($_SERVER["REQUEST_METHOD"] == "DELETE"){ 
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from pktype where id = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        // Ingore
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