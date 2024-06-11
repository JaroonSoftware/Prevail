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
        select s.*, 
            i.stcode,
            i.stname,
            i.stnameEN,
            concat(u2.firstname, ' ', u2.lastname) approved_name,
            s2.amount qty
        from spmaster s
        join items i on s.spcode = i.stcode
        left join srdetail s2 on s.srcode = s2.srcode and s.srdetailid = s2.id
        left join user u2 on s.approved_by = u2.code
        where s.approved_result = 'approved' and s.srcode = :code"; 

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode( array("data"=>$res) );
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