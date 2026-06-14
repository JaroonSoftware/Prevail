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
                COUNT(s.socode) AS pending_so_count
            FROM somaster AS s
            INNER JOIN customer AS c ON s.cuscode = c.cuscode
            LEFT JOIN county AS b ON c.county_code = b.county_code
            WHERE s.doc_status = 'รอออกใบส่งของ'
              AND c.active_status = 'Y'
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
