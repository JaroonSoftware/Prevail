<?php 
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    try { 
        $res = null;

        $join_detail = "";
        $cuscode_filter = !empty($cuscode) ? " and s.cuscode = '$cuscode'" : "";
        $status_filter = " and (s.doc_status = 'รอจัดเตรียมสินค้า' or s.doc_status = 'จัดเตรียมสินค้ายังไม่ครบ')";
        $socode_filter = "";

        if (!empty($socode)) {
            $tmp_array = array_filter(array_map('trim', explode(',', $socode)));

            if (!empty($tmp_array)) {
                $tmp_array = array_map(function ($value) {
                    return "'" . str_replace("'", "''", $value) . "'";
                }, $tmp_array);

                $join_detail = " inner join `dndetail` as d on (s.dncode=d.dncode) ";
                $socode_filter = " and d.socode in (" . implode(',', $tmp_array) . ")";
                $status_filter = " and s.doc_status != 'ยกเลิก'";
            }
        }
        
        $sql = "SELECT distinct s.dncode,c.cuscode, c.cusname,c.prename, s.doc_status
            FROM dnmaster as s 
            $join_detail
            inner join `customer` as c on (s.cuscode=c.cuscode) 
            where 1 = 1
            $cuscode_filter
            $socode_filter
            $status_filter
            order by s.dncode desc ";
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