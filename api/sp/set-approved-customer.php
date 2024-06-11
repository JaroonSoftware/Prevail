<?php
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 
http_response_code(400);
$conn->beginTransaction();
if ($_SERVER["REQUEST_METHOD"] == "PUT"){
    $rest_json = file_get_contents("php://input");
    $_PUT = json_decode($rest_json, true); 
    extract($_PUT, EXTR_OVERWRITE, "_"); 

    try {  
        $action_datetime = date("Y-m-d H:i:s"); 
        $action_username = intval( $token->userid ?? 0 );
        
        $sql = "
        update spmaster set  
        cusapproved_date = :approved_date,
        cusapproved_by = :approved_by,
        cusapproved_status = :cusapproved_status
        where spcode = :spcode";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Update data error => {$conn->errorInfo()}"); 

        $stmt->bindParam( ':approved_date', $action_datetime, PDO::PARAM_STR);
        $stmt->bindValue( ':approved_by', $action_username, PDO::PARAM_INT);
        $stmt->bindValue( ':cusapproved_status', $cusapproved_status, PDO::PARAM_STR);
        $stmt->bindValue( ':spcode', $spcode, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("approved data error => $error");
            die;
        }

        // if($approved_result == 'approved'){
        //     create_items_with_spcode($conn, $spcode);
        // }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=>$code));
    } catch (mysqli_sql_exception $e) { 
        $conn->rollback();
        http_response_code(400); 
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        $conn->rollback();
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