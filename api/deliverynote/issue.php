<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_date = date("Y-m-d H:i:s");
    $action_user = $token->userid;
    // echo $action_user;


    if ($_SERVER["REQUEST_METHOD"] == "GET") {

        $code = $_GET["code"];

        $sql = "SELECT a.code,a.dncode,a.stcode,a.socode, a.price, a.unit, a.qty ,i.stname,a.del_qty";
        $sql .= " FROM `dndetail` as a";
        $sql .= " inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.dncode = :code";
        $sql .= " order by i.seq";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stock=array();
        $qty=array();

        foreach ($detail as $ind => $val) {
            $val = (object)$val;            

            $strSQL = "SELECT qty FROM items_stock where stcode = :stcode ";
            $stmt5 = $conn->prepare($strSQL);
            if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt5->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);

            if (!$stmt5->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $res = $stmt5->fetch(PDO::FETCH_ASSOC);
            // extract($res, EXTR_OVERWRITE, "_");

            $stockQty = isset($res['qty']) ? (float)$res['qty'] : 0;

            $qty[] = (float)$val->qty;      // จำนวนที่ต้องการตัด (จาก dn detail)
            $stock[] = $stockQty;           // จำนวนสต็อกจริงจาก DB

            if ($stockQty < (float)$val->qty) {
                throw new PDOException("{$val->stname} สต๊อกเหลือไม่พอให้ตัดออก (สต๊อกคงเหลือ $stockQty) จำนวนที่ต้องการตัด {$val->qty}");
            }

            $strSQL = "SELECT amtprice FROM `items_stock` where stcode =:stcode ";
            $stmt6 = $conn->prepare($strSQL);
            if (!$stmt6) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt6->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);

            if (!$stmt6->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $res = $stmt6->fetch(PDO::FETCH_ASSOC);
            extract($res, EXTR_OVERWRITE, "_");

            $sql2 = "UPDATE items_stock SET qty= qty-:qty,price= amtprice*qty,amtprice = price/qty,updated_date = CURRENT_TIMESTAMP() where stcode =:stcode ";
            $stmt2 = $conn->prepare($sql2);
            if (!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            // $stmt2->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt2->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            // $stmt2->bindParam(":discount", $val->discount, PDO::PARAM_STR);
            $stmt2->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);

            if (!$stmt2->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
            

            $sql = "update sodetail set total_cost=total_cost+(:amtprice* :qty) where socode = :socode and stcode = :stcode";

            $stmt3 = $conn->prepare($sql);
            if (!$stmt3) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt3->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt3->bindParam(":socode", $val->socode, PDO::PARAM_STR);
            $stmt3->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt3->bindParam(":amtprice", $amtprice, PDO::PARAM_STR);

            if (!$stmt3->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
        }


        $sql = "
                update dnmaster 
                set
                issue_status = 'ตัดสต๊อกแล้ว',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where dncode = :dncode";

        $stmt4 = $conn->prepare($sql);
        if (!$stmt4) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt4->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt4->bindParam(":dncode", $val->dncode, PDO::PARAM_STR);

        if (!$stmt4->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }



        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'message' => 'ตัดสต๊อกเรียบร้อยแล้ว','stock'=>$stock,'qty'=>$qty) );
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
