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
    $pocode = !empty($pocode) ? "and a.pocode like '%$pocode%'" : "";
    $supcode = !empty($supcode) ? "and c.supcode like '%$supcode%'" : "";
    $supname = !empty($supname) ? "and c.supname like '%$supname%'" : "";
    // $spcode_cdt = !empty($spcode) ? "and e.spcode like '%$spcode%'" : "";
    // $spname_cdt = !empty($spname) ? "and e.spname like '%$spname%'" : "";
    $created_by = !empty($created_by) ? "and ( u.firstname like '%$created_by%' or u.lastname like '%$created_by%' )" : "";
    $podate = "";
    if( !empty($podate_form) && !empty($podate_to) ) {
        $podate = "and date_format( a.podate, '%Y-%m-%d' ) >= '$podate_form' and date_format( a.podate, '%Y-%m-%d' ) <= '$podate_to' ";
    } 
    
    try {   
        $sql = " 
        select 
        a.*,
        c.*,
        concat(u.firstname, ' ', u.lastname) created_name
        from pomaster a        
        left join supplier c on a.supcode = c.supcode        
        left join user u on a.created_by = u.code
        where 1 = 1 and a.active_status = 'Y'
        $pocode
        $supcode
        $supname
        $created_by
        $podate
        order by a.created_date desc ;";


        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);  

        http_response_code(200);
        echo json_encode(array("data"=>$res));
        // echo json_encode(array("data" => $res,"sql" => $sql));
        
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