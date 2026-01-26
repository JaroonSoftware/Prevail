<?php
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
   
    try {  
        $code = $_GET["code"]; 

        $sql = "SELECT a.catalog_code,a.cuscode,c.stcode,c.price,d.stname,d.unit ";
        $sql .= " FROM `catalog_link` as a ";        
        $sql .= " left join catalog_master as b on a.catalog_code = b.catalog_code ";
        $sql .= " left join catalog_detail as c on a.catalog_code = c.catalog_code ";
        $sql .= " left join items as d on c.stcode = d.stcode ";
        $sql .= " where a.cuscode = :code and b.start_date <= CURDATE() and b.stop_date >= CURDATE() ";
        $sql .= " order by c.stcode ";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();

        http_response_code(200);
        echo json_encode(array("data"=>$detail));
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