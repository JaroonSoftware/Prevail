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
    $dncode_cdt = !empty($dncode) ? "and d.dncode like '%$dncode%'" : "";
    $cuscode_cdt = !empty($cuscode) ? "and d.cuscode like '%$cuscode%'" : "";
    $cusname_cdt = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    $srcode_cdt = !empty($srcode) ? "and d.srcode like '%$srcode%'" : "";
    $created_date_cdt = "";
    if( !empty($created_form) && !empty($created_to) ) {
        $created_date_cdt = "and date_format( d.created_date, '%Y-%m-%d' ) >= '$created_form' and date_format( d.created_date, '%Y-%m-%d' ) <= '$created_to' ";
    } 
    $delivery_date_cdt = "";
    if( !empty($dndate_form) && !empty($dndate_to) ) {
        $delivery_date_cdt = "and date_format( d.dndate, '%Y-%m-%d' ) >= '$dndate_form' and date_format( d.dndate, '%Y-%m-%d' ) <= '$dndate_to' ";
    } 

    $spname_cdt = !empty($spname) ? "and sm.spresult like '%$spname%'" : "";

    try {    
        $sql = "
        select 
        d.*,
        c.cusname,
        concat(u.firstname, ' ', u.lastname) created_name,
        sm.spresult
        from dnmaster d
        left join (
            select
                dd.dncode,
                group_concat(  stname SEPARATOR '' ) spcheck,
                group_concat( concat( '<div><span> - ', stname, '</span></div>') SEPARATOR '' ) spresult
            from dndetail dd
            group by dd.dncode
        ) sm on d.dncode = sm.dncode
        left join customer c on d.cuscode = c.cuscode
        left join user u on d.created_by = u.code
        where 1 = 1 and d.status != 'N'
        $dncode_cdt
        $cuscode_cdt
        $cusname_cdt
        $srcode_cdt
        $created_date_cdt
        $delivery_date_cdt
        $spname_cdt
        order by created_date desc ;";

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