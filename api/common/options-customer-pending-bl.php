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

        /* ลูกค้าที่มีใบขายข้อมูลเก่ารอวางบิล */
        try {
            $have = array_flip(array_column($res, 'cuscode'));
            $lg = $conn->prepare("
                SELECT c.cuscode, c.cusname, c.prename, b.county_name,
                    c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,
                    c.tel, c.contact, c.fax, c.taxnumber,
                    CONCAT(c.idno, ' ', c.road, ' ', c.subdistrict, ' ', c.district, ' ', c.zipcode) AS address,
                    0 AS pending_dn_count, COUNT(l.id) AS pending_legacy_count
                FROM legacy_sales l
                INNER JOIN customer c ON c.cuscode = l.cuscode
                LEFT JOIN county AS b ON c.county_code = b.county_code
                WHERE l.active_status = 'Y' AND c.active_status = 'Y'
                  AND l.doc_no NOT IN (SELECT bd.dncode FROM bl_detail bd INNER JOIN bl_master bm ON bd.blcode = bm.blcode
                                       WHERE bm.doc_status != 'ยกเลิก' AND bm.active_status = 'Y' AND bd.dncode IS NOT NULL)
                GROUP BY c.cuscode, c.cusname, c.prename, b.county_name, c.idno, c.road, c.subdistrict, c.district,
                    c.province, c.zipcode, c.tel, c.contact, c.fax, c.taxnumber");
            $lg->execute();
            foreach ($lg->fetchAll(PDO::FETCH_ASSOC) as $r) if (!isset($have[$r['cuscode']])) $res[] = $r;
            usort($res, function ($a, $b) { return strcmp($a['cuscode'], $b['cuscode']); });
        } catch (Exception $e) { /* ยังไม่ได้รัน SQL legacy_sales */ }

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
