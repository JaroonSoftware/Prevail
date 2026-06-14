<?php
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    try {
        $sql = "
            SELECT
                c.cuscode, c.cusname, c.prename, b.county_name,
                c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,
                c.tel, c.contact, c.fax, c.taxnumber,
                CONCAT(c.idno, ' ', c.road, ' ', c.subdistrict, ' ', c.district, ' ', c.zipcode) AS address,
                COUNT(d.dncode) AS pending_dn_count
            FROM dnmaster AS d
            INNER JOIN customer AS c ON d.cuscode = c.cuscode
            LEFT JOIN county AS b ON c.county_code = b.county_code
            WHERE d.doc_status != 'ยกเลิก'
              AND c.active_status = 'Y'
              AND d.dncode NOT IN (
                  SELECT DISTINCT bd.dncode
                  FROM bl_detail bd
                  INNER JOIN bl_master bm ON bd.blcode = bm.blcode
                  WHERE bm.doc_status != 'ยกเลิก'
                    AND bm.active_status = 'Y'
              )
            GROUP BY
                c.cuscode, c.cusname, c.prename, b.county_name,
                c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,
                c.tel, c.contact, c.fax, c.taxnumber
            ORDER BY c.cuscode
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data" => $res));
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally {
        $conn = null;
    }
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
?>
