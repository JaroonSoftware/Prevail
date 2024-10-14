<?php
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");  
    $ivcode = !empty($ivcode) ? "and a.ivcode like '%$ivcode%'" : "";
    $cuscode = !empty($cuscode) ? "and c.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    $created_by = !empty($created_by) ? "and ( u.firstname like '%$created_by%' or u.lastname like '%$created_by%' )" : "";
    $ivdate = "";
    if( !empty($ivdate_form) && !empty($ivdate_to) ) {
        $ivdate = "and date_format( a.ivdate, '%Y-%m-%d' ) >= '$ivdate_form' and date_format( a.ivdate, '%Y-%m-%d' ) <= '$ivdate_to' ";
    } 
    
    try {   
        $sql = " 
        select 
        a.*,
        c.*,
        concat(u.firstname, ' ', u.lastname) created_name
        from ivmaster a        
        left join customer c on a.cuscode = c.cuscode        
        left join user u on a.created_by = u.code
        where 1 = 1 
        $ivcode
        $cuscode
        $cusname
        $created_by
        $ivdate
        order by a.ivcode desc ;";


        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);  

        http_response_code(200);
        // echo json_encode(array("data"=>$res));
        echo json_encode(array("data" => $res,"sql" => $sql));
        
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