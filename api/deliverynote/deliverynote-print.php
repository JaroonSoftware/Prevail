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
        $sql = "SELECT 
            dm.dncode,
            dm.dndate,
            dm.total_price,
            dm.remark,
            dm.cuscode,
            c.prename,
            c.cusname,
            CONCAT(
                COALESCE(c.idno, ''), ' ',
                COALESCE(c.road, ''), ' ',
                COALESCE(c.subdistrict, ''), ' ',
                COALESCE(c.district, ''), ' ',
                COALESCE(c.province, ''), ' ',
                COALESCE(c.zipcode, '')
            ) as address,
            c.contact,
            c.tel,
            c.fax,
            co.county_name,
            dd.code,
            dd.socode,
            dd.stcode,
            i.stname,
            sd.qty,
            dd.price,
            sd.unit,
            COUNT(dd.code) as del_count,
            SUM(dd.qty) as del_qty,
            sd.unit as del_unit
        ";
        $sql .= " FROM dnmaster as dm ";
        $sql .= " INNER JOIN customer as c on dm.cuscode = c.cuscode ";
        $sql .= " LEFT JOIN county as co on c.county_code = co.county_code ";
        $sql .= " LEFT JOIN dndetail as dd on dm.dncode = dd.dncode ";
        $sql .= " LEFT JOIN items as i on dd.stcode = i.stcode ";
        $sql .= " LEFT JOIN sodetail as sd on dd.socode = sd.socode and dd.stcode = sd.stcode ";
        $sql .= " WHERE dm.dncode = :code ";
        $sql .= " GROUP BY 
            dm.dncode, dm.dndate, dm.total_price, dm.remark, dm.cuscode,
            c.prename, c.cusname, c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,
            c.contact, c.tel, c.fax, co.county_name,
            dd.code, dd.socode, dd.stcode, i.stname, sd.qty, dd.price, sd.unit ";
        $sql .= " ORDER BY dd.socode, i.seq, dd.stcode ";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $header = array();
        $detail = array();

        if (!empty($rows)) {
            $first = $rows[0];
            $header = array(
                "dncode" => $first["dncode"],
                "ivdate" => $first["dndate"],
                "dndate" => $first["dndate"],
                "cuscode" => $first["cuscode"],
                "prename" => $first["prename"],
                "cusname" => $first["cusname"],
                "address" => trim($first["address"]),
                "contact" => $first["contact"],
                "tel" => $first["tel"],
                "fax" => $first["fax"],
                "remark" => $first["remark"],
                "payment" => null,
                "county_name" => $first["county_name"],
                "total_price" => $first["total_price"],
            );

            foreach ($rows as $row) {
                if (empty($row["stcode"])) {
                    continue;
                }

                $detail[] = array(
                    "code" => $row["code"],
                    "dncode" => $row["dncode"],
                    "socode" => $row["socode"],
                    "stcode" => $row["stcode"],
                    "stname" => $row["stname"],
                    "qty" => $row["qty"],
                    "price" => $row["price"],
                    "unit" => $row["unit"],
                    "del_count" => $row["del_count"],
                    "del_qty" => $row["del_qty"],
                    "del_unit" => $row["del_unit"],
                );
            }
        }

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
