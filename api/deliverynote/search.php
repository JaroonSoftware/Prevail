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
    $dncode = !empty($dncode) ? "and a.dncode like '%$dncode%'" : "";
    $socode = !empty($socode) ? "and exists (select 1 from dndetail dd where dd.dncode = a.dncode and dd.socode like '%$socode%')" : "";
    $blcode = !empty($blcode) ? "and exists (select 1 from bl_detail bld inner join bl_master blm on (bld.blcode = blm.blcode and blm.doc_status != 'ยกเลิก' and blm.active_status = 'Y') where bld.dncode = a.dncode and bld.blcode like '%$blcode%')" : "";
    $cuscode = !empty($cuscode) ? "and c.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    $created_by = !empty($created_by) ? "and ( u.firstname like '%$created_by%' or u.lastname like '%$created_by%' )" : "";
    $dndate = "";
    if( !empty($dndate_form) && !empty($dndate_to) ) {
        $dndate = "and date_format( a.dndate, '%Y-%m-%d' ) >= '$dndate_form' and date_format( a.dndate, '%Y-%m-%d' ) <= '$dndate_to' ";
    } 
    
    try {   
        $sql = "
        select
        a.*,
        c.*,
        concat(u.firstname, ' ', u.lastname) created_name,
        bl.blcode as billing_blcode
        from dnmaster a
        left join customer c on (a.cuscode = c.cuscode)
        left join user u on a.created_by = u.code
        left join (
            select d.dncode, min(d.blcode) as blcode
            from bl_detail d
            inner join bl_master m on (d.blcode = m.blcode and m.doc_status != 'ยกเลิก' and m.active_status = 'Y')
            group by d.dncode
        ) bl on (a.dncode = bl.dncode)
        where 1 = 1 and a.doc_status != 'ยกเลิก'
        $dncode
        $socode
        $blcode
        $cuscode
        $cusname
        $created_by
        $dndate
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