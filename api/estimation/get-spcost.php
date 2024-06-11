<?php
ob_start();  
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");
$db = new DbConnect;
$conn = $db->connect();
http_response_code(400);
if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_");  
    try {  
        $sql = "
        select
        s.id,
		s.spcode,
		s.spno,
		s.stcode,
		s.amount,
		s.percent,
		s.totalpercent,
		s.method,
		s.stepno,
		s.amount_total,
		s.amount_after_lost,
		s.lost,
        i.price,
        i.yield,
        i.multiply,
        i.stname
        from spdetail s 
        left join items i on s.stcode =  i.stcode
        where 1 = 1 and s.spcode = :code"; 

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $spcost = $stmt->fetchAll(PDO::FETCH_ASSOC);
 

        http_response_code(200);
        echo json_encode(array("data"=>array( "spcost" => $spcost)));
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