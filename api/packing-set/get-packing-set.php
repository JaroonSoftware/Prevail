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
    $packingset_name_cdt = !empty($packingset_name) ? "and a.packingset_name like '%$packingset_name%'" : "";
    $packingset_group_cdt = !empty($packingset_group) ? "and pg.id in ($packingset_group)" : "";

    #region check loading search
    $loadingtype_name = !empty($loadingtype_name) ? "and pl.packingsetid in ( select distinct psb.packingsetid from packingset_loadingtype psb where psb.loadingtype_name in ($loadingtype_name) )" : "";
    $loadingtype_name_cdt = !empty($loadingtype_name) ? "and spt.loadingtype is not null" : "";
    #endregion
    // $created_date_cdt = "";
    // if( !empty($created_form) && !empty($created_to) ) {
    //     $created_date_cdt = "and date_format( a.created_date, '%Y-%m-%d' ) >= '$created_form' and date_format( a.created_date, '%Y-%m-%d' ) <= '$created_to' ";
    // } 
    // $created_by_cdt = !empty($created_by) ? "and sub.created_name like '%$created_by%'" : ""; 
    // $delivery_date_cdt = "";
    // if( !empty($dndate_form) && !empty($dndate_to) ) {
    //     $delivery_date_cdt = "and date_format( d.dndate, '%Y-%m-%d' ) >= '$dndate_form' and date_format( d.dndate, '%Y-%m-%d' ) <= '$dndate_to' ";
    // } 

    try {   
        $sql = "SELECT * FROM (
            select            
                a.*,
                concat( u.firstname, ' ', u.lastname ) created_name,
                concat( u1.firstname, ' ', u1.lastname ) updated_name,
                pg.packingset_group,
                concat('[', spt.loadingtype,']') loadingtype
            from packingset a 
            	join packingset_group pg on a.packingset_groupid = pg.id
                left join `user` u on a.created_by =  u.code
                left join `user` u1 on a.updated_by =  u1.code
                left join (
		           select 
			       pl.packingsetid, 
			       group_concat(concat( '\"', pl.loadingtype_name, '\"' ) SEPARATOR ',' ) loadingtype
			       from packingset_loadingtype pl
			       where 1 = 1 $loadingtype_name
			       group by pl.packingsetid
		        ) spt on a.id = spt.packingsetid
            where 1 = 1
            $packingset_name_cdt
            $created_date_cdt
            $packingset_group_cdt
            $loadingtype_name_cdt
        ) sub
        where 1 = 1
        -- $created_by_cdt 
        order by sub.created_date desc;";

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