<?php 
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    try { 
        $res = null;
        $cuscode_filter = !empty($cuscode) ? " and d.cuscode = '$cuscode'" : "";

        $join_detail = "";
        $dncode_filter = "";

        if (!empty($dncode)) {
            $tmp_array = array_filter(array_map('trim', explode(',', $dncode)));

            if (!empty($tmp_array)) {
                $tmp_array = array_map(function ($value) {
                    return "'" . str_replace("'", "''", $value) . "'";
                }, $tmp_array);

                $join_detail = " inner join `dndetail` as dd on (d.socode=dd.socode) ";
                $dncode_filter = " and dd.dncode in (" . implode(',', $tmp_array) . ")";
            }
        }

        $status_filter = !empty($dncode_filter) ? " and d.doc_status != 'ยกเลิก'" : " and d.doc_status = 'รอออกใบวางบิล'";

        $sql = "SELECT distinct d.socode,d.sodate,d.customer_po,c.cuscode, c.cusname,c.prename, d.doc_status
            FROM somaster as d
            $join_detail
            inner join `customer` as c on (d.cuscode=c.cuscode)
            where 1 = 1
            $status_filter
            $cuscode_filter
            $dncode_filter
            order by d.socode desc ";
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
        // Ignore
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
?>