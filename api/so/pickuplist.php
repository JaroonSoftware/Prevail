<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = "SELECT a.socode,a.sodate,a.deldate,a.cuscode,CONCAT(c.prename,' ',c.cusname) as cusname,CONCAT(COALESCE(c.idno, '') ,' ', COALESCE(c.road, ''),' ', COALESCE(c.subdistrict, ''),' ', COALESCE(c.district, ''),' ',COALESCE(c.zipcode, '') ) as address
        ,c.zipcode,c.contact,c.tel,c.fax,a.total_price,a.vat,a.grand_total_price,a.remark ";
        $sql .= " FROM `somaster` as a ";
        $sql .= " inner join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " where a.socode = :code and a.doc_status <> 'รอยืนยันใบขายสินค้า' ";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$header) throw new PDOException("ไม่พบใบขายสินค้า หรือใบขายยังไม่ได้ยืนยัน (ต้องยืนยันใบขายก่อนพิมพ์ใบจัดสินค้า)");

        $sql = "SELECT a.code,a.socode,a.stcode, a.price, a.unit, a.qty,i.stname,t.typename ";
        $sql .= " FROM `sodetail` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " left outer join `itemtype` as t on (t.typecode=i.typecode)  ";
        $sql .= " where a.socode = :code";
        $sql .= " order by i.seq";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $header, "detail" => $detail)));
    }
} catch (PDOException $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally {
    $conn = null;
}
ob_end_flush();
exit;
