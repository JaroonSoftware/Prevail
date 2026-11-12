<?php

require_once dirname(__DIR__) . "/common/packing.php";
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
        $action_user = $token->userid;
        if (!is_array($detail) || !$detail) throw new Exception('Select at least one item.');

        /* แยกถุงตาม "บรรทัด" ของใบขาย (sodetail.code) — สินค้าตัวเดียวกันหลายบรรทัดไม่ถูกรวมกัน
           ต้องรัน sql/2026-11-11_package_barcode_line.sql ก่อน ถ้ายังไม่รันจะทำแบบเดิม (รวมตามรหัสสินค้า) */
        $hasLineCol = (bool)$conn->query("SHOW COLUMNS FROM package_barcode LIKE 'sodetail_code'")->fetch();
        $seenItem = array();

        foreach ($detail as $ind => $val) {

            $count = 0;
            $packingReady = packing_schema_ready($conn);
            $lock = $conn->prepare('SELECT doc_status FROM somaster WHERE socode=:s FOR UPDATE');
            $lock->execute(['s'=>$val['socode']]);
            $soStatus = $lock->fetchColumn();
            if ($soStatus === false) throw new Exception('Sales order not found.');
            /* ใบขายที่ยังไม่ยืนยัน ห้ามปริ้นหน้าถุง */
            if ($soStatus === 'รอยืนยันใบขายสินค้า') throw new Exception("ใบขายสินค้า {$val['socode']} ยังไม่ได้ยืนยัน กรุณายืนยันใบขายก่อนปริ้นหน้าถุง");
            $lineCode = (isset($val['code']) && is_numeric($val['code'])) ? (int)$val['code'] : 0;
            $lineMode = false;
            if ($hasLineCol && $lineCode > 0) {
                /* ใบที่เคยปริ้นแบบเดิม (ถุงไม่ผูกบรรทัด) ของสินค้านี้ -> ใช้แบบเดิมต่อ กันถุงซ้ำ */
                $leg = $conn->prepare('SELECT COUNT(*) FROM package_barcode WHERE socode=:s AND stcode=:i AND sodetail_code IS NULL');
                $leg->execute(['s'=>$val['socode'],'i'=>$val['stcode']]);
                $lineMode = (int)$leg->fetchColumn() === 0;
            }
            if (!$lineMode) {
                /* แบบเดิม: รวมทุกบรรทัดของสินค้านี้ ทำครั้งเดียวต่อใบขาย+สินค้า */
                $ik = $val['socode'] . '|' . $val['stcode'];
                if (isset($seenItem[$ik])) continue;
                $seenItem[$ik] = true;
            }
            if ($lineMode) {
                $lines = $conn->prepare('SELECT d.qty,d.unit,' . ($packingReady ? 'd.packing_weight' : 'i.packing_weight') . ',i.stname FROM sodetail d JOIN items i ON i.stcode=d.stcode WHERE d.socode=:s AND d.code=:c');
                $lines->execute(['s'=>$val['socode'],'c'=>$lineCode]);
            } else {
                $lines = $conn->prepare('SELECT d.qty,d.unit,' . ($packingReady ? 'd.packing_weight' : 'i.packing_weight') . ',i.stname FROM sodetail d JOIN items i ON i.stcode=d.stcode WHERE d.socode=:s AND d.stcode=:i ORDER BY d.code');
                $lines->execute(['s'=>$val['socode'],'i'=>$val['stcode']]);
            }
            $saved = $lines->fetchAll(PDO::FETCH_ASSOC);
            if (!$saved) throw new Exception('Sales order item not found.');
            $val['qty'] = 0;
            foreach ($saved as $row) {
                $val['qty'] += (float)$row['qty'];
            }
            $val['unit']=$saved[0]['unit']; $val['stname']=$saved[0]['stname'];
            $val['packing_weight']=$saved[0]['packing_weight'];
            if ($lineMode) {
                $existing=$conn->prepare('SELECT COUNT(*) FROM package_barcode WHERE socode=:s AND sodetail_code=:c');
                $existing->execute(['s'=>$val['socode'],'c'=>$lineCode]);
            } else {
                $existing=$conn->prepare('SELECT COUNT(*) FROM package_barcode WHERE socode=:s AND stcode=:i');
                $existing->execute(['s'=>$val['socode'],'i'=>$val['stcode']]);
            }
            $existingCount=(int)$existing->fetchColumn();


            if ($existingCount === 0) {
                foreach ($saved as $row) {
                if ($row['unit'] !== $saved[0]['unit'] || $row['packing_weight'] !== $saved[0]['packing_weight'])
                    throw new Exception('Duplicate item rows have different units or packing sizes. Separate these orders before packing.');
                }

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

                // Use only the sales-order snapshot; reprints use existing barcode rows.
                $pack_f = (float)($val['packing_weight'] ?? 0);
                [$full_bag, $remain] = packing_split($qty_f, $pack_f);

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
                    $newId = $conn->lastInsertId();
                    if ($lineMode) $conn->prepare('UPDATE package_barcode SET sodetail_code=:c WHERE package_id=:p')->execute(['c'=>$lineCode,'p'=>$newId]);
                    $package_id = str_pad($newId, 10, "0", STR_PAD_LEFT);

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
                    $newId = $conn->lastInsertId();
                    if ($lineMode) $conn->prepare('UPDATE package_barcode SET sodetail_code=:c WHERE package_id=:p')->execute(['c'=>$lineCode,'p'=>$newId]);
                    $package_id = str_pad($newId, 10, "0", STR_PAD_LEFT);

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
                where socode = :socode and " . ($lineMode ? "code = :line" : "stcode = :stcode");

                $stmt4 = $conn->prepare($sql);
                if (!$stmt4) throw new PDOException("Insert data error => {$conn->errorInfo()}");
    
                $stmt4->bindValue(":socode", $val['socode'], PDO::PARAM_STR);
                if ($lineMode) $stmt4->bindValue(":line", $lineCode, PDO::PARAM_INT);
                else $stmt4->bindValue(":stcode", $val['stcode'], PDO::PARAM_STR);
    
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
                where a.stcode = :stcode and a.socode = :socode ";
                if ($lineMode) $strSQL .= " and a.sodetail_code = :line ";
                $stmt = $conn->prepare($strSQL);
                $params = ['stcode'=>$val['stcode'], 'socode'=>$val['socode']];
                if ($lineMode) $params['line'] = $lineCode;
                if (!$stmt->execute($params)) {
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
        /* เที่ยวรถของลูกค้า (เช่น "5.ป่าตอง-กมลา") สำหรับพิมพ์บนสติ๊กเกอร์ — ยังไม่รัน sql/2026-11-11_delivery_trip.sql ก็ไม่แสดง */
        if ($conn->query("SHOW COLUMNS FROM customer LIKE 'trip_id'")->fetch()) {
            $tripSt = $conn->prepare("SELECT CONCAT(t.trip_no, '.', t.trip_name) FROM customer c
                                      JOIN delivery_trip t ON t.trip_id = c.trip_id AND t.active_status = 'Y' WHERE c.cuscode = :c");
            $tripCache = array();
            foreach ($listbarcode as &$grp) {
                if (!is_array($grp)) continue;
                foreach ($grp as &$lb) {
                    $cc = (string)($lb['cuscode'] ?? '');
                    if (!array_key_exists($cc, $tripCache)) {
                        $tripSt->execute(array('c' => $cc));
                        $tripCache[$cc] = $tripSt->fetchColumn() ?: '';
                    }
                    $lb['trip'] = $tripCache[$cc];
                }
                unset($lb);
            }
            unset($grp);
        }
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
