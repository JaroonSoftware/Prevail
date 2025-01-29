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

        $listbarcode;

        foreach ($detail as $ind => $val) {

            $count = 0;

            $strSQL = "SELECT count(code) as num FROM `sodetail` where packing_status != 'ยังไม่ปริ้นหน้าถุง' and stcode = '" . $val['stcode'] . "' and socode = '" . $val['socode'] . "'  ";
            $stmt = $conn->prepare($strSQL);
            $stmt->execute();
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            extract($res, EXTR_OVERWRITE, "_");
            if ($num==0) {
                for ($count = 0; $count < intval($val['qty'] / $val['packing_weight']); $count++) {
                    $sql = "INSERT INTO package_barcode
                    (so_weight,sup_weight,weight, socode, stcode, created_date)
                    VALUES(:so_weight,:sup_weight,0, :socode, :stcode, current_timestamp())";

                    $stmt = $conn->prepare($sql);
                    if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                    $stmt->bindParam(":so_weight", number_format($val['qty'], 2), PDO::PARAM_STR);
                    $stmt->bindValue(":sup_weight", number_format($val['packing_weight'], 2), PDO::PARAM_STR);
                    $stmt->bindValue(":socode", $val['socode'], PDO::PARAM_STR);
                    $stmt->bindValue(":stcode", $val['stcode'], PDO::PARAM_STR);

                    if (!$stmt->execute()) {
                        $error = $conn->errorInfo();
                        throw new PDOException("Insert data error => $error");
                        die;
                    }
                    $package_id = $conn->lastInsertId();

                    $listbarcode[$ind][$count]['stcode'] = $val['stcode'];
                    $listbarcode[$ind][$count]['weight'] = number_format($val['packing_weight'], 2);
                    $listbarcode[$ind][$count]['package_id'] = $package_id;
                    $listbarcode[$ind][$count]['stname'] = $val['stname'];
                    $listbarcode[$ind][$count]['socode'] = $val['socode'];
                    $listbarcode[$ind][$count]['cusname'] = $val['cusname'];
                    $listbarcode[$ind][$count]['cuscode'] = $val['cuscode'];
                    
                }

                if ($val['qty'] % $val['packing_weight']) {
                    $sql = "INSERT INTO package_barcode
                    (so_weight,weight, socode, stcode, created_date)
                    VALUES(:so_weight,:weight, :socode, :stcode, current_timestamp())";

                    $stmt = $conn->prepare($sql);
                    if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                    $stmt->bindParam(":so_weight", number_format($val['qty'], 2), PDO::PARAM_STR);
                    $stmt->bindValue(":weight", number_format($val['qty'] % $val['packing_weight'], 2), PDO::PARAM_STR);
                    $stmt->bindValue(":socode", $val['socode'], PDO::PARAM_STR);
                    $stmt->bindValue(":stcode", $val['stcode'], PDO::PARAM_STR);

                    if (!$stmt->execute()) {
                        $error = $conn->errorInfo();
                        throw new PDOException("Insert data error => $error");
                        die;
                    }
                    $package_id = $conn->lastInsertId();

                    $listbarcode[$ind][$count]['stcode'] = $val['stcode'];
                    $listbarcode[$ind][$count]['weight'] = number_format($val['qty'] % $val['packing_weight'], 2);
                    $listbarcode[$ind][$count]['package_id'] = $package_id;
                    $listbarcode[$ind][$count]['stname'] = $val['stname'];
                    $listbarcode[$ind][$count]['socode'] = $val['socode'];
                    $listbarcode[$ind][$count]['cusname'] = $val['cusname'];
                    $listbarcode[$ind][$count]['cuscode'] = $val['cuscode'];
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
                $strSQL = "SELECT a.stcode,a.weight,a.package_id,i.stname,a.socode,c.cusname,c.cuscode FROM `package_barcode` as a
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
