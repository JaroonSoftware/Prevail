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
    $pilotscale_code_cdt = !empty($pilotscale_code) ? "and a.pilotscale_code like '%$pilotscale_code%'" : "";
    $spcode_cdt = !empty($spcode) ? "and a.spcode like '%$spcode%'" : "";
    $spname_cdt = !empty($spname) ? "and b.spname like '%$spname%'" : "";
    $pkcode_cdt = !empty($pkcode) ? "and b.pkcode like '%$pkcode%'" : "";
    $pkname_cdt = !empty($pkname) ? "and i.stname like '%$pkname%'" : "";
    $created_date_cdt = "";
    if( !empty($created_form) && !empty($created_to) ) {
        $created_date_cdt = "and date_format( a.created_date, '%Y-%m-%d' ) >= '$created_form' and date_format( a.created_date, '%Y-%m-%d' ) <= '$created_to' ";
    } 
    // $delivery_date_cdt = "";
    // if( !empty($dndate_form) && !empty($dndate_to) ) {
    //     $delivery_date_cdt = "and date_format( d.dndate, '%Y-%m-%d' ) >= '$dndate_form' and date_format( d.dndate, '%Y-%m-%d' ) <= '$dndate_to' ";
    // } 

    try {   
        $sql = " 
        select 
        a.*,
        b.spname, 
        b.pkcode,
        i.stname pkname,  
        concat( u.firstname, ' ', u.lastname ) created_name,
        concat( u1.firstname, ' ', u1.lastname ) updated_name
        from pilotscale a
        join spmaster b on a.spcode = b.spcode
        left join items i on b.pkcode = i.stcode 
        left join `user` u on a.created_by =  u.code
        left join `user` u1 on a.updated_by =  u1.code
        where 1 = 1
        $pilotscale_code_cdt
        $spcode_cdt
        $spname_cdt
        $pkcode_cdt
        $pkname_cdt
        $created_date_cdt
        order by a.created_date desc ;";

        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);  

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
        $conn = null;
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}
ob_end_flush(); 
exit;
?>