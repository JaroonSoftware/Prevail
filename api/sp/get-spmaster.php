<?php
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $requset = json_decode($rest_json, true);

    if(isset($requset))  extract($requset, EXTR_OVERWRITE, "_");
    else extract($_POST, EXTR_OVERWRITE, "_");

    $spcode_cdt = !empty($spcode) ? "and a.spcode like '%$spcode%'" : "";
    $spname_cdt = !empty($spname) ? "and a.spname like '%$spname%'" : "";
    
    $srcode_cdt = !empty($srcode) ? "and a.srcode like '%$srcode%'" : ""; 
    
    #region check tags search
    $sptag_cdt = !empty($sptag) ? "and tt.spcode in ( select distinct spcode from sptags tsb where tsb.tags in ($sptag) )" : "";
    $tag_cdt = !empty($sptag) ? "and spt.tag is not null" : "";
    #endregion

    #region check sample date
    $spdate_cdt = "";
    if( !empty($spdate_form) && !empty($spdate_to) ) {
        $spdate_cdt = "and date_format( a.spdate, '%Y-%m-%d' ) >= '$spdate_form' and date_format( a.spdate, '%Y-%m-%d' ) <= '$spdate_to' ";
    }
    #endregion

    $approved_result_cdt = !empty($approved_result) ? "and a.approved_result in ($approved_result)" : "";
    try { 
        $p = $p ?? "";
        $key = $key ?? "";
        $res = null;
        $sql = "
        select
            a.*,
            b.cuscode,
            c.cusname,
            u.firstname,
            u.lastname,
            concat(u.firstname, ' ', u.lastname) created_name,
            IFNULL(a.description, '') description,
            i.stname pkname,
            ac.str file_attach,
            concat('[', spt.tag,']') tag
        FROM spmaster a
        left join srmaster b on a.srcode =  b.srcode
        left join customer c on b.cuscode = c.cuscode
        left join user u on a.created_by  = u.code
        left join items i on a.pkcode = i.stcode
        left join (
           select 
	       tt.spcode, 
	       group_concat(  concat( '\"', tt.tags, '\"' ) SEPARATOR ',' ) tag
	       from sptags tt
	       where 1 = 1
           $sptag_cdt
	       group by tt.spcode
        ) spt on a.spcode = spt.spcode
        left join (
          select aa.refcode, group_concat(  aa.id SEPARATOR ',' ) str
          from attachments_control aa where aa.ref = 'Sample Preparation'
          group by aa.refcode
        ) ac on a.spcode = ac.refcode
        where 1 = 1 
        $spcode_cdt
        $spname_cdt
        $spdate_cdt
        $srcode_cdt
        $tag_cdt
        $approved_result_cdt
        order by a.created_date desc;";

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