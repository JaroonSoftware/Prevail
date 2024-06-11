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
        $action_datetime = date("Y-m-d H:i:s");
        $action_username = $token->userid;

        $sql = "delete from sptags where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove tags data error => $error");
        } 
        
        // var_dump($_POST);
        $sql = "insert sptags (spcode, tags, created_by, created_date) values (?, ?, ?, CURRENT_TIMESTAMP())";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        foreach( $tags as $ind => $val){ 
            $stmt->bindParam( 1, $code, PDO::PARAM_STR);
            $stmt->bindValue( 2, $val, PDO::PARAM_STR);
            $stmt->bindValue( 3, $action_username, PDO::PARAM_STR);    
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }         
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $master->srcode)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        // ignore
    } else if($_SERVER["REQUEST_METHOD"] == "DELETE"){ 
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from sptags where spcode = :id and tags = :val";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code, 'val' => $val ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove tags data error => $error");
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = "select * from sptags;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting master data error => $error");
        }
        $data = $stmt->fetch(PDO::FETCH_ASSOC); 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("data"=>$data) ));
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