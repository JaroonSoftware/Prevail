<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");
$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);

try {

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");

        $listbarcode = [];

        foreach ($detail as $ind => $val) {

            $count = 0;

            $strSQL = "SELECT count(code) as num FROM `sodetail` where packing_status != 'ยังไม่ปริ้นหน้าถุง' and stcode = '" . $val['stcode'] . "' and socode = '" . $val['socode'] . "'  ";
            $stmt = $conn->prepare($strSQL);
            $stmt->execute();
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            extract($res, EXTR_OVERWRITE, "_");
            if ($num==0) {
                /* ต้อง join customer ด้วย: $val มาจาก sodetail ฝั่งหน้าจอ ซึ่งไม่มี
                   cusname/cuscode ติดมา (ดู query GET ใน package/manage.php)
                   ถ้าไม่ดึงจาก DB ตรงนี้ ปริ้นครั้งแรกชื่อลูกค้าจะว่างเสมอ */
                $strSQL = "SELECT a.cuscode, CONCAT(COALESCE(c.prename,''),' ',COALESCE(c.cusname,'')) as cusname
                FROM somaster as a
                inner join customer as c on (a.cuscode = c.cuscode)
                where a.socode = :socode  ";
                $stmt5 = $conn->prepare($strSQL);
                if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                $stmt5->bindValue(":socode", $val['socode'], PDO::PARAM_STR);

                if (!$stmt5->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }

                /* กำหนดตัวแปรตรงๆ ไม่ใช้ extract() เพราะ extract ตัวอื่นในลูป
                   ทับค่าเหล่านี้ได้ง่าย */
                $res     = $stmt5->fetch(PDO::FETCH_ASSOC);
                $cuscode = $res['cuscode'] ?? '';
                $cusname = trim($res['cusname'] ?? '');

                /* ต้องคิดแบบทศนิยม: % ของ PHP เป็น modulo จำนวนเต็ม
                   ทำให้ qty 0.30 / ถุงละ 1.00 ได้ 0 % 1 = 0 -> ไม่เกิดถุงเลย */
                $qty_f    = (float) $val['qty'];
                $pack_f   = (float) $val['packing_weight'];
                $full_bag = $pack_f > 0 ? (int) floor($qty_f / $pack_f) : 0;
                $remain   = $pack_f > 0 ? fmod($qty_f, $pack_f) : $qty_f;

                for ($count = 0; $count < $full_bag; $count++) {
                    $sql = "INSERT INTO package_barcode
                    (so_weight,sup_weight,weight, socode, stcode, created_date)
                    VALUES(:so_weight,:sup_weight,0, :socode, :stcode, current_timestamp())";

                    $stmt = $conn->prepare($sql);
                    if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                    /* ใช้ bindValue: bindParam ต้องรับตัวแปรแบบ by-reference
                       ส่งค่าที่ได้จากฟังก์ชันตรงๆ จะ fatal ใน PHP 8
                       และ number_format ต้องไม่ใส่ , คั่นหลักพัน ไม่งั้น insert เพี้ยน */
                    $stmt->bindValue(":so_weight", number_format($qty_f, 2, '.', ''), PDO::PARAM_STR);
                    $stmt->bindValue(":sup_weight", number_format($pack_f, 2, '.', ''), PDO::PARAM_STR);
                    $stmt->bindValue(":socode", $val['socode'], PDO::PARAM_STR);
                    $stmt->bindValue(":stcode", $val['stcode'], PDO::PARAM_STR);

                    if (!$stmt->execute()) {
                        $error = $conn->errorInfo();
                        throw new PDOException("Insert data error => $error");
                        die;
                    }
                    $package_id = str_pad($conn->lastInsertId(), 10, "0", STR_PAD_LEFT);

                    $listbarcode[$ind][$count]['stcode'] = $val['stcode'];
                    $listbarcode[$ind][$count]['sup_weight'] = number_format($pack_f, 2, '.', '');
                    $listbarcode[$ind][$count]['package_id'] = $package_id;
                    $listbarcode[$ind][$count]['stname'] = $val['stname'];
                    $listbarcode[$ind][$count]['socode'] = $val['socode'];
                    $listbarcode[$ind][$count]['cusname'] = $cusname;
                    $listbarcode[$ind][$count]['cuscode'] = $cuscode;
                    /* หน่วยสินค้าตามที่ระบุในใบขายสินค้า (sodetail.unit) */
                    $listbarcode[$ind][$count]['unit'] = $val['unit'] ?? '';
                    
                }

                /* เทียบกับ epsilon กันปัญหาปัดเศษของ float */
                if ($remain > 0.0001) {
                    $sql = "INSERT INTO package_barcode
                    (so_weight,sup_weight, socode, stcode, created_date)
                    VALUES(:so_weight,:sup_weight, :socode, :stcode, current_timestamp())";

                    $stmt = $conn->prepare($sql);
                    if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                    $stmt->bindValue(":so_weight", number_format($qty_f, 2, '.', ''), PDO::PARAM_STR);
                    $stmt->bindValue(":sup_weight", number_format($remain, 2, '.', ''), PDO::PARAM_STR);
                    $stmt->bindValue(":socode", $val['socode'], PDO::PARAM_STR);
                    $stmt->bindValue(":stcode", $val['stcode'], PDO::PARAM_STR);

                    if (!$stmt->execute()) {
                        $error = $conn->errorInfo();
                        throw new PDOException("Insert data error => $error");
                        die;
                    }
                    /* ต้อง pad ให้เหมือนถุงเต็ม ไม่งั้น Lot No./QR คนละรูปแบบกัน */
                    $package_id = str_pad($conn->lastInsertId(), 10, "0", STR_PAD_LEFT);

                    $listbarcode[$ind][$count]['stcode'] = $val['stcode'];
                    $listbarcode[$ind][$count]['sup_weight'] = number_format($remain, 2, '.', '');
                    $listbarcode[$ind][$count]['package_id'] = $package_id;
                    $listbarcode[$ind][$count]['stname'] = $val['stname'];
                    $listbarcode[$ind][$count]['socode'] = $val['socode'];
                    $listbarcode[$ind][$count]['cusname'] = $cusname;
                    $listbarcode[$ind][$count]['cuscode'] = $cuscode;
                    /* หน่วยสินค้าตามที่ระบุในใบขายสินค้า (sodetail.unit) */
                    $listbarcode[$ind][$count]['unit'] = $val['unit'] ?? '';
                }

                $sql = "update sodetail
                set
                packing_status = 'ปริ้นหน้าถุงแล้ว'
                where socode = :socode and stcode = :stcode";

                $stmt4 = $conn->prepare($sql);
                if (!$stmt4) throw new PDOException("Insert data error => {$conn->errorInfo()}");
    
                $stmt4->bindValue(":socode", $val['socode'], PDO::PARAM_STR);
                $stmt4->bindValue(":stcode", $val['stcode'], PDO::PARAM_STR);
    
                if (!$stmt4->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }
                
            }
            else
            {
                /* unit ดึงด้วย subquery ไม่ใช้ join กับ sodetail
                   เพราะถ้า sodetail มีหลายแถวของ socode+stcode เดียวกัน
                   join จะทำให้ผลลัพธ์คูณจำนวนแถวขึ้นมา ปริ้นได้ฉลากเกิน */
                $strSQL = "SELECT a.stcode,a.sup_weight,a.weight,a.package_id,i.stname,a.socode,c.cusname,c.cuscode,
                (select sd.unit from `sodetail` as sd
                 where sd.socode = a.socode and sd.stcode = a.stcode limit 1) as unit
                FROM `package_barcode` as a
                inner join items as i on (a.stcode=i.stcode)
                inner join somaster as s on (a.socode=s.socode)
                inner join customer as c on (s.cuscode=c.cuscode)
                where a.stcode = '" . $val['stcode'] . "' and a.socode = '" . $val['socode'] . "'  ";
                $stmt = $conn->prepare($strSQL);
                if (!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    http_response_code(404);
                    throw new PDOException("Geting data error => $error");
                }
                $listbarcode[$ind] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }

            $strSQL = "SELECT count(code) as count FROM `sodetail` where socode = :socode and packing_status != 'ปริ้นหน้าถุงแล้ว' ";
            $stmt5 = $conn->prepare($strSQL);
            if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt5->bindParam(":socode", $val['socode'], PDO::PARAM_STR);

            if (!$stmt5->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $res = $stmt5->fetch(PDO::FETCH_ASSOC);
            extract($res, EXTR_OVERWRITE, "_");
            if ($count == 0) {

                $sql = "
                update somaster 
                set
                print_status = 'ปริ้นหน้าถุงครบแล้ว',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where socode = :socode";
            } else {
                $sql = "
                update somaster 
                set
                print_status = 'ปริ้นใบปะยังไม่ครบ',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where socode = :socode";
            }

            $stmt3 = $conn->prepare($sql);
            if (!$stmt3) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt3->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt3->bindValue(":socode", $val['socode'], PDO::PARAM_STR);

            if (!$stmt3->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

        $conn->commit();
        http_response_code(200);
        /* array_values กัน index ขาดช่วง (เช่นบางรายการไม่มีถุง) ทำให้ json_encode
           กลายเป็น object แทน array แล้วฝั่ง React map ไม่ได้ -> ฉลากหายทั้งชุด */
        $listbarcode = array_values(array_map('array_values', $listbarcode));
        echo json_encode(array("data" => $listbarcode));

    } else {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
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
