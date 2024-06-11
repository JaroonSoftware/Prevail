<?php 
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    $type_code = !empty($type) ? "and  lower(t.typename) = lower('$type')" : "";
    try { 
        $p = $p ?? "";
        $res = null;
        if($p == 'items'){
            $sql = "
			select i.*, UUID() `key`
            from items i
            where 1 = 1 and i.active_status = 'Y'
            $type_code";

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC); 
        } else  if ($p === 'items-type' ){
            $sql = "
			select t.*
            from `type` t
            where 1 = 1 and t.active_status = 'Y'"; 
            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);             
        } else {
            $sql = "
            select  i.stcode value, i.stname label 
            from items i
            where 1 = 1 and i.active_status = 'Y'
            $type_code"; 

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC); 
        }

        http_response_code(200);
        echo json_encode(array("data"=>$res));
    } catch (mysqli_sql_exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        // Ignore
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}
ob_end_flush(); 
exit;
?>