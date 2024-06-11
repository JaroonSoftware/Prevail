<?php
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "PUT"){
    $rest_json = file_get_contents("php://input");
    $_PUT = json_decode($rest_json, true); 
    extract($_PUT, EXTR_OVERWRITE, "_"); 

    try {  
        $action_datetime = date("Y-m-d H:i:s"); 
        $action_username = intval( $token->userid ?? 0 );

        // var_dump($action_username, $action_datetime); exit;
        $sql = "
        update spmaster set  
        approved_date = null,
        approved_by = null,
        approved_result = 'waiting_approve',
        approved_remark = null,
        cancel_approved_date = :cancel_approved_date,
        cancel_approved_by = :cancel_approved_by,
        spstatus = 'pending'
        where spcode = :spcode";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Update data error => {$conn->errorInfo()}"); 

        $stmt->bindParam( ':cancel_approved_date', $action_datetime, PDO::PARAM_STR);
        $stmt->bindValue( ':cancel_approved_by', $action_username, PDO::PARAM_INT); 
        $stmt->bindValue( ':spcode', $spcode, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("cancel approved data error => $error");
            die;
        }


        http_response_code(200);
        echo json_encode(array("data"=>$spcode));
    } catch (mysqli_sql_exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        $conn = null;
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
} 
ob_end_flush(); 
exit;
?>