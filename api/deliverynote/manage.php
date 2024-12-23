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
        $sql = "insert grmaster (`dncode`, `dndate`, `supcode`,
        `payment`, `total_price`, `vat`, `grand_total_price`,`remark`,created_by,updated_by) 
        values (:dncode,:dndate,:supcode,:payment,:total_price,:vat,:grand_total_price,
        :remark,:action_user,:action_user)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;
        $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
        $stmt->bindParam(":dndate", $header->dndate, PDO::PARAM_STR);
        $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":vat", $header->vat, PDO::PARAM_STR);
        $stmt->bindParam(":grand_total_price", $header->grand_total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        update_dncode($conn);

        $code = $conn->lastInsertId();
        // var_dump($master); exit;

        $sql = "insert into grdetail (dncode,stcode,pocode,qty,price,unit)
        values (:dncode,:stcode,:pocode,:qty,:price,:unit)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":pocode", $val->pocode, PDO::PARAM_STR);            
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_INT);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }

            $sql2 = "insert into grbarcode (no,dncode,stcode,unit_weight,barcode_status)
            values (:no,:dncode,:stcode,0,'ยังไม่ออก barcode')";
            $stmt2 = $conn->prepare($sql2);
            if (!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            for($count=1;$count<=$val->qty;$count++)
            {   
                $stmt2->bindParam(":no", $count, PDO::PARAM_STR);             
                $stmt2->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
                $stmt2->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);

                if (!$stmt2->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                }
            }
        }

        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            
            if ($val->qty_buy == ($val->qty +$val->recamount)) {
                $sql = "
            update pomaster 
            set
            doc_status = 'รับของครบแล้ว',
            updated_date = CURRENT_TIMESTAMP(),
            updated_by = :action_user
            where pocode = :pocode";

                $stmt = $conn->prepare($sql);
                if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
                $stmt->bindParam(":pocode", $val->pocode, PDO::PARAM_STR);

                if (!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }
            } else {
                $sql = "
            update pomaster 
            set
            doc_status = 'ยังรับของไม่ครบ',
            updated_date = CURRENT_TIMESTAMP(),
            updated_by = :action_user
            where pocode = :pocode";

                $stmt = $conn->prepare($sql);
                if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

                $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
                $stmt->bindParam(":pocode", $val->pocode, PDO::PARAM_STR);

                if (!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }
            }

            $sql = "update podetail set
            recamount = recamount+:qty
            where pocode = :pocode";
            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt->bindParam(":pocode", $val->pocode, PDO::PARAM_STR);

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
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
        update grmaster 
        set
        dndate = :dndate,
        supcode = :supcode,
        payment = :payment,
        total_price = :total_price,
        vat = :vat,
        grand_total_price = :grand_total_price,
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where dncode = :dncode";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":dndate", $header->dndate, PDO::PARAM_STR);
        $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":vat", $header->vat, PDO::PARAM_STR);
        $stmt->bindParam(":grand_total_price", $header->grand_total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from grdetail where dncode = :dncode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['dncode' => $header->dncode])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into grdetail (dncode,stcode,unit,qty,price)
        values (:dncode,:stcode,:unit,:qty,:price,)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_INT);
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
        $sql = "SELECT a.dncode,a.dndate,a.cuscode,c.prename,c.cusname,CONCAT(COALESCE(c.idno, '') ,' ', COALESCE(c.road, ''),' ', COALESCE(c.subdistrict, ''),' ', COALESCE(c.district, ''),' ',COALESCE(c.zipcode, '') ) as address
        ,c.zipcode,c.contact,c.tel,c.fax,a.remark ";
        $sql .= " FROM `dnmaster` as a ";
        $sql .= " inner join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " where a.dncode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.dncode,a.stcode, a.unit_weight,a.created_date, a.barcode_id,i.stname,i.unit";
        $sql .= " FROM `dndetail` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.dncode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $header, "detail" => $detail,'sql' => $sql)));
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
