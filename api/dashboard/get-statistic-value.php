<?php
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    // extract($_POST, EXTR_OVERWRITE, "_"); 
    try { 
        $sql = "
        select 
        ( select count(1) from spmaster s where s.approved_result = 'waiting_approve' ) waiting,
        ( select count(1) from spmaster s where s.approved_result = 'approved' and s.spdate = date_format(current_date, '%Y-%m-%d')  ) daily,
        ( select count(1) from spmaster s where s.approved_result = 'approved' and date_format( s.spdate, '%Y-%m') = date_format(current_date, '%Y-%m')  ) monthly,
        ( select count(1) from spmaster s where s.approved_result = 'approved' and date_format( s.spdate, '%Y') = date_format(current_date, '%Y')  ) yearly
        "; 

        $stmt = $conn->prepare($sql); 
        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 
        $res = $stmt->fetch(PDO::FETCH_ASSOC);  

        http_response_code(200);
        echo json_encode(array("data"=> $res ));
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