<?php 
ob_start(); 
include_once( dirname(__FILE__, 2)."/onload.php"); 

$db = new DbConnect;
$conn = $db->connect(); 
http_response_code(400);
try {

    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 

        extract($_POST, EXTR_OVERWRITE, "_");
        $srcode_cdt = !empty($srcode) ? "and s.srcode like '%$srcode%'" : "";
        $cusname_cdt = !empty($cusname) ? "and c.cusname like '%$cusname%'" : ""; 
    
        #region check sample date
        $srdate_cdt = "";
        if( !empty($srdate_form) && !empty($srdate_to) ) {
            $srdate_cdt = "and date_format( s.srdate, '%Y-%m-%d' ) >= '$srdate_form' and date_format( s.srdate, '%Y-%m-%d' ) <= '$srdate_to' ";
        }
        #endregion

        $sql = "
        select 
            s.srcode, 
            s.srdate, 
            s.duedate,
            s.cuscode, 
            c.cusname, 
            s.description,
            s.srstatus,
            sd.spresult,
            sd.spcheck,
            ac.str file_attach,
            sd.spresult_array
        from srmaster s 
        join (
        	select
        	    ss.srcode,
        	    group_concat(  ss.spname SEPARATOR '' ) spcheck,
        	    group_concat( concat( '<div><span> - ', ss.spname, '</span></div>') SEPARATOR '' ) spresult,
                concat('[',group_concat( concat( '\"', ss.spname, '\"') SEPARATOR ',' ), ']') spresult_array
        	from srdetail ss
        	group by ss.srcode
        ) sd on s.srcode = sd.srcode
        join customer c on s.cuscode = c.cuscode
        left join (
          select aa.refcode, group_concat(  aa.id SEPARATOR ',' ) str
          from attachments_control aa where aa.ref = 'Sample Request'
          group by aa.refcode
        ) ac on s.srcode = ac.refcode        
        where 1 = 1
        $srcode_cdt
        $srdate_cdt
        $cusname_cdt
        order by s.srcode desc;";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array('status' => '1', 'data' => $data));
    } 

} catch (PDOException $e) {  
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) {  
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally{
    $conn = null;
}  
ob_end_flush(); 
exit; 
