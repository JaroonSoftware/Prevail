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
    $pkname_cdt = !empty($pkname) ? "and (p.pkname like '%$pkname%' or p.pknameTH like '%$pkname%')" : "";
    $expsname_cdt = !empty($expsname) ? "and p.expsname like '%$expsname%'" : "";
    $expscode_cdt = !empty($expscode) ? "and p.expscode like '%$expscode%'" : "";
    $pktype_cdt = !empty($pktype) ? "and p.pktypeid in ($pktype)" : "";
 

    try { 
        $p = $p ?? "";
        $key = $key ?? "";
        $res = null;
        $sql = "
        select 
        p.id,
        p.pkcode,
        p.pkname,
        p.pknameTH,
        p.pktypeid,
        p.expscode,
        p.expsname,
        p.supcode,
        p.remark,
        p.updated_date,
        p.updated_by,
        p.price,
        pt.pktype,
        s.supname,
        un.unit,
        concat(u.firstname, ' ', u.lastname) updated_name,
        ac.str file_attach
        from pkmaster p
        left join pktype pt on p.pktypeid = pt.id and pt.status = 'Y'
        left join supplier s on p.supcode = s.supcode
        left join unit un on p.unitid = un.unitcode
        left join user u on p.updated_by  = u.code
        left join (
          select aa.refcode, group_concat(  aa.id SEPARATOR ',' ) str
          from attachments_control aa where aa.ref = 'Packaging'
          group by aa.refcode
        ) ac on p.pkcode = ac.refcode     
        where 1 = 1
        $pkname_cdt
        $expsname_cdt
        $expscode_cdt
        $pktype_cdt
        order by p.updated_date desc";

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