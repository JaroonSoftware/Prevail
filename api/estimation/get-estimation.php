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
    $estimate_code_cdt = !empty($estcode) ? "and e.estcode like '%$estcode%'" : "";
    $spcode_cdt = !empty($spcode) ? "and e.spcode like '%$spcode%'" : "";
    $spname_cdt = !empty($spname) ? "and e.spname like '%$spname%'" : "";
    // $created_by_cdt = !empty($created_by) ? "and ( u1.firstname like '%$created_by%' or u1.lastname like '%$created_by%' )" : "";
    $created_date_cdt = "";
    if( !empty($created_form) && !empty($created_to) ) {
        $created_date_cdt = "and date_format( e.created_date, '%Y-%m-%d' ) >= '$created_form' and date_format( e.created_date, '%Y-%m-%d' ) <= '$created_to' ";
    } 
    $spdate_cdt = "";
    if( !empty($spdate_form) && !empty($spdate_to) ) {
        $spdate_cdt = "and date_format( s.spdate, '%Y-%m-%d' ) >= '$spdate_form' and date_format( s.spdate, '%Y-%m-%d' ) <= '$spdate_to' ";
    } 

    #region check tags search
    $sptag_cdt = !empty($sptag) ? "and tt.spcode in ( select distinct spcode from sptags tsb where tsb.tags in ($sptag) )" : "";
    $tag_cdt = !empty($sptag) ? "and spt.tag is not null" : "";
    #endregion

    try {   
        $sql = " 
        select 
        e.*,
        s.spdate,
        concat(u1.firstname, ' ', u1.lastname) created_name,
        concat(u.firstname, ' ', u.lastname) updated_name,
        concat('[', spt.tag,']') tag
        from estimation e
        join spmaster s on e.spcode = s.spcode
        left join (
           select 
           tt.spcode, 
           group_concat(  concat( '\"', tt.tags, '\"' ) SEPARATOR ',' ) tag
           from sptags tt
           where 1 = 1
           $sptag_cdt
           group by tt.spcode
        ) spt on e.spcode = spt.spcode
        left join user u on e.updated_by = u.code
        left join user u1 on e.created_by = u1.code
        where 1 = 1
        $estimate_code_cdt
        $spcode_cdt
        $spname_cdt
        $created_date_cdt
        $created_by_cdt
        $spdate_cdt
        $tag_cdt    
        order by e.created_date desc ;";

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