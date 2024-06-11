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
    $shippingtype_name_cdt = !empty($shippingtype_name) ? "and l.shippingtype_name like '%$shippingtype_name%'" : "";
    $created_date_cdt = "";
    if( !empty($created_form) && !empty($created_to) ) {
        $created_date_cdt = "and date_format( l.created_date, '%Y-%m-%d' ) >= '$created_form' and date_format( l.created_date, '%Y-%m-%d' ) <= '$created_to' ";
    } 
    // $delivery_date_cdt = "";
    // if( !empty($dndate_form) && !empty($dndate_to) ) {
    //     $delivery_date_cdt = "and date_format( d.dndate, '%Y-%m-%d' ) >= '$dndate_form' and date_format( d.dndate, '%Y-%m-%d' ) <= '$dndate_to' ";
    // } 

    try {   
        $sql = " 
        select
        l.*,
        lts.price
        from shippingtype l
        left join (
            select 
            ls.shippingtype_id,  
            sum( price ) price 
            from shippingtype_terms ls  
            group by ls.shippingtype_id
        ) lts on l.id =  lts.shippingtype_id
        where 1 = 1
        $shippingtype_name_cdt
        $created_date_cdt
        order by l.created_date desc ;";

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