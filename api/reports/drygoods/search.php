<?php
ob_start(); 
include_once(dirname(__FILE__, 2)."/../onload.php");
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");  
    $socode = !empty($socode) ? "and a.socode like '%$socode%'" : "";
    $cuscode = !empty($cuscode) ? "and c.cuscode like '%$cuscode%'" : "";
    $cusname = !empty($cusname) ? "and c.cusname like '%$cusname%'" : "";
    // $spcode_cdt = !empty($spcode) ? "and e.spcode like '%$spcode%'" : "";
    // $spname_cdt = !empty($spname) ? "and e.spname like '%$spname%'" : "";
    $created_by = !empty($created_by) ? "and ( u.firstname like '%$created_by%' or u.lastname like '%$created_by%' )" : "";
    $sodate = "";
    if( !empty($sodate_form) && !empty($sodate_to) ) {
        $sodate = "and date_format( a.sodate, '%Y-%m-%d' ) >= '$sodate_form' and date_format( a.sodate, '%Y-%m-%d' ) <= '$sodate_to' ";
    } 
    
    try {   
        $sql = " 
        SELECT 
            a.socode,
            a.sodate,
            a.cuscode,
            c.cusname,
            b.stcode,
            i.stname,
            b.qty,
            dg.total_qty,
            IFNULL(f.qty, 0) AS qty_book,
            (b.qty + IFNULL(f.qty, 0) - IFNULL(dg.total_qty, 0) - (IFNULL(e.qty, 0) )) AS qty_result,   -- จำนวนคงเหลือหลังหัก
            e.qty as qty_stock,
            b.unit,
            a.deldate,
            a.remark
        FROM somaster a        
        LEFT JOIN sodetail b ON a.socode = b.socode
        LEFT JOIN items i ON b.stcode = i.stcode
        LEFT JOIN customer c ON a.cuscode = c.cuscode  
        LEFT JOIN (
            SELECT
                socode,
                stcode,
                SUM(qty) AS total_qty
            FROM drygoods_record
            GROUP BY socode, stcode
        ) dg
          ON dg.socode = b.socode
         AND dg.stcode = b.stcode
        LEFT JOIN items_stock e ON b.stcode = e.stcode
        LEFT JOIN drygoods_book f ON a.sodate = f.book_date AND b.stcode = f.stcode
        WHERE 1 = 1
          AND i.typecode = '2'
          $socode
          $cuscode
          $cusname
          $created_by
          $sodate
          AND (b.qty - IFNULL(dg.total_qty, 0) - IFNULL(e.qty, 0) ) > 0
        ORDER BY a.socode DESC;";


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