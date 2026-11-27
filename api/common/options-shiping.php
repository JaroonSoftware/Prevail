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
        $status_filter = " and s.doc_status != 'ยกเลิก'
            and s.dncode not in (
                select distinct bd.dncode from bl_detail bd
                inner join bl_master bm on bd.blcode = bm.blcode
                where bm.doc_status != 'ยกเลิก' and bm.active_status = 'Y'
            )";
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
        
        $sql = "SELECT distinct s.dncode,s.dndate,s.total_price,IFNULL(s.discount,0) AS discount,0 AS legacy,c.cuscode, c.cusname,c.prename, s.doc_status
            FROM dnmaster as s
            $join_detail
            inner join `customer` as c on (s.cuscode=c.cuscode) 
            where 1 = 1
            $cuscode_filter
            $socode_filter
            $status_filter
            order by CHAR_LENGTH(s.dncode) desc, s.dncode desc ";
            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC); 

        /* ใบขายข้อมูลเก่า (นำเข้าจากระบบเก่า) ที่ยังไม่วางบิล — วางบิลรวมกับใบส่งของได้ */
        if (!empty($cuscode) && empty($socode)) {
            try {
                $lg = $conn->prepare("SELECT l.doc_no AS dncode, l.doc_date AS dndate, l.total AS total_price, 0 AS discount,
                        c.cuscode, c.cusname, c.prename, 'ข้อมูลเก่า' AS doc_status, 1 AS legacy
                    FROM legacy_sales l INNER JOIN customer c ON c.cuscode = l.cuscode
                    WHERE l.cuscode = :c AND l.active_status = 'Y'
                      AND l.doc_no NOT IN (SELECT bd.dncode FROM bl_detail bd INNER JOIN bl_master bm ON bd.blcode = bm.blcode
                                           WHERE bm.doc_status != 'ยกเลิก' AND bm.active_status = 'Y' AND bd.dncode IS NOT NULL)
                    ORDER BY l.doc_date, l.doc_no");
                $lg->execute(array('c' => $cuscode));
                $res = array_merge($res, $lg->fetchAll(PDO::FETCH_ASSOC));
            } catch (Exception $e) { /* ยังไม่ได้รัน SQL legacy_sales */ }
        }

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