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

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        $sql = "insert ivmaster (`ivcode`, `ivdate`, `cuscode`,`payment`,`deldate`, `total_price`,`remark`,created_by,updated_by) 
        values (:ivcode,:ivdate,:cuscode,:payment,:deldate,:total_price,
        :remark,:action_user,:action_user)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;
        $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
        $stmt->bindParam(":ivdate", $header->ivdate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":deldate", $header->deldate, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        update_ivcode($conn);

        $code = $conn->lastInsertId();
        // var_dump($master); exit;

        $sql = "insert into ivdetail (ivcode,dncode,stcode,qty,price,unit,discount,vat)
        values (:ivcode,:dncode,:stcode,:qty,:price,:unit,:discount,:vat)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
            $stmt->bindParam(":dncode", $val->dncode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindParam(":discount", $val->discount, PDO::PARAM_INT);
            $stmt->bindParam(":vat", $val->vat, PDO::PARAM_INT);

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
            // echo $val->dncode;
            $sql = "
            update dndetail
            set
            doc_status = 'ออกใบแจ้งหนี้แล้ว'
            where dncode = :dncode and stcode = :stcode";


            $stmt2 = $conn->prepare($sql);
            if (!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt2->bindParam(":dncode", $val->dncode, PDO::PARAM_STR);
            $stmt2->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);

            if (!$stmt2->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $strSQL = "SELECT count(code) as count FROM `dndetail` where doc_status != 'ออกใบแจ้งหนี้แล้ว' and dncode = '$val->dncode' ";
            $stmt4 = $conn->prepare($strSQL);
            $stmt4->execute();
            $res = $stmt4->fetch(PDO::FETCH_ASSOC);
            extract($res, EXTR_OVERWRITE, "_");
            if ($count == 0) {

                $sql = "
                        update dnmaster 
                        set
                        doc_status = 'ออกใบแจ้งหนี้แล้ว',
                        updated_date = CURRENT_TIMESTAMP(),
                        updated_by = :action_user
                        where dncode = :dncode ";

                $stmt3 = $conn->prepare($sql);
                if (!$stmt3) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                $stmt3->bindParam(":action_user", $action_user, PDO::PARAM_INT);
                $stmt3->bindValue(":dncode", $val->dncode, PDO::PARAM_STR);

                if (!$stmt3->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }
            }
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);
        $sql = "
        update ivmaster 
        set
        ivdate = :ivdate,
        cuscode = :cuscode,
        payment = :payment,
        deldate = :deldate,
        total_price = :total_price,    
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where ivcode = :ivcode";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":ivdate", $header->ivdate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":deldate", $header->deldate, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from ivdetail where ivcode = :ivcode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['ivcode' => $header->ivcode])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into ivdetail (ivcode,dncode,stcode,unit,qty,price,discount,vat)
        values (:ivcode,:dncode,:stcode,:unit,:qty,:price,:discount,:vat)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
            $stmt->bindParam(":dncode", $val->dncode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_INT);
            $stmt->bindParam(":discount", $val->discount, PDO::PARAM_INT);
            $stmt->bindParam(":vat", $val->vat, PDO::PARAM_INT);
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
        // $code = $_DELETE["code"];
        $code = $_GET["code"];

        $sql = "delete from packingset where code = :code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "delete from packingset_detail where packingsetcode = :code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status" => 1));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = "SELECT a.ivcode,a.ivdate,a.deldate,a.cuscode,CONCAT(c.prename,' ',c.cusname) as cusname,CONCAT(COALESCE(c.idno, '') ,' ', COALESCE(c.road, ''),' ', COALESCE(c.subdistrict, ''),' ', COALESCE(c.district, ''),' ',COALESCE(c.zipcode, '') ) as address
        ,c.zipcode,c.contact,c.tel,c.fax,a.payment,a.total_price,a.remark ";
        $sql .= " FROM `ivmaster` as a ";
        $sql .= " inner join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " where a.ivcode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.ivcode,a.dncode,a.stcode, a.price, a.discount, a.unit, a.qty ,a.vat ,i.stname ";
        $sql .= " FROM `ivdetail` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.ivcode = :code";

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
