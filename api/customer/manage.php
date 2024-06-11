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

    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        
        $sql = "INSERT INTO customer (`cuscode`, `prename`, `cusname`, `taxnumber`, `idno`,`road`, `province`, 
        `subdistrict`,`district`,`zipcode`, `delidno`,`delroad`, `delprovince`, 
        `delsubdistrict`,`deldistrict`,`delzipcode`, `tel`, `fax`,`contact`, `email`,`remark`, `active_status`, created_by, created_date) 
        values (:cuscode,:prename,:cusname,:taxnumber,:idno,:road,:province,:subdistrict,:district,:zipcode,
        :delidno,:delroad,:delprovince,:delsubdistrict,:deldistrict,:delzipcode,
        :tel,:fax,:contact,:email,:remark,'Y',:action_user,:action_date)";
        
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        
        $stmt->bindParam(":cuscode", $cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":prename", $prename, PDO::PARAM_STR);
        $stmt->bindParam(":cusname", $cusname, PDO::PARAM_STR);     
        $stmt->bindParam(":taxnumber", $taxnumber, PDO::PARAM_STR);
        $stmt->bindParam(":idno", $idno, PDO::PARAM_STR); 
        $stmt->bindParam(":road", $road, PDO::PARAM_STR);         
        $stmt->bindParam(":province", $province, PDO::PARAM_STR);   
        $stmt->bindParam(":subdistrict", $subdistrict, PDO::PARAM_STR);   
        $stmt->bindParam(":district", $district, PDO::PARAM_STR);                
        $stmt->bindParam(":zipcode", $zipcode, PDO::PARAM_STR);
        $stmt->bindParam(":delidno", $delidno, PDO::PARAM_STR); 
        $stmt->bindParam(":delroad", $delroad, PDO::PARAM_STR);         
        $stmt->bindParam(":delprovince", $delprovince, PDO::PARAM_STR);   
        $stmt->bindParam(":delsubdistrict", $delsubdistrict, PDO::PARAM_STR);   
        $stmt->bindParam(":deldistrict", $deldistrict, PDO::PARAM_STR);                
        $stmt->bindParam(":delzipcode", $delzipcode, PDO::PARAM_STR);        
        $stmt->bindParam(":tel", $tel, PDO::PARAM_STR);
        $stmt->bindParam(":fax", $fax, PDO::PARAM_STR);
        $stmt->bindParam(":contact", $contact, PDO::PARAM_STR);        
        $stmt->bindParam(":email", $email, PDO::PARAM_STR);        
        $stmt->bindParam(":remark", $remark, PDO::PARAM_STR);        
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT); 
        $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);  

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $conn->commit();
        $strSQL = "UPDATE cuscode SET ";
        $strSQL .= " number= number+1 ";
        $strSQL .= " order by id desc LIMIT 1 ";

        $stmt3 = $conn->prepare($strSQL);
        if ($stmt3->execute()) {
            http_response_code(200);
            echo json_encode(array("data"=> array("id" => "ok", 'message' => 'เพิ่มลูกค้าสำเร็จ')));
        }
        else
        {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }    

    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);

        $sql = "
        update customer 
        set
        cuscode = :cuscode,
        prename = :prename,
        cusname = :cusname,
        taxnumber = :taxnumber,
        idno = :idno,
        road = :road,
        province = :province,
        subdistrict = :subdistrict,
        district = :district,
        zipcode = :zipcode,
        delidno = :delidno,
        delroad = :delroad,
        delprovince = :delprovince,
        delsubdistrict = :delsubdistrict,
        deldistrict = :deldistrict,
        delzipcode = :delzipcode,
        tel = :tel,
        fax = :fax,
        contact = :contact,
        email = :email,
        remark = :remark,
        active_status = :active_status,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where cuscode = :cuscode";

        
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt->bindParam(":cuscode", $cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":prename", $prename, PDO::PARAM_STR);
        $stmt->bindParam(":cusname", $cusname, PDO::PARAM_STR);     
        $stmt->bindParam(":taxnumber", $taxnumber, PDO::PARAM_STR);
        $stmt->bindParam(":idno", $idno, PDO::PARAM_STR); 
        $stmt->bindParam(":road", $road, PDO::PARAM_STR);         
        $stmt->bindParam(":province", $province, PDO::PARAM_STR);   
        $stmt->bindParam(":subdistrict", $subdistrict, PDO::PARAM_STR);   
        $stmt->bindParam(":district", $district, PDO::PARAM_STR);                
        $stmt->bindParam(":zipcode", $zipcode, PDO::PARAM_STR);
        $stmt->bindParam(":delidno", $delidno, PDO::PARAM_STR); 
        $stmt->bindParam(":delroad", $delroad, PDO::PARAM_STR);         
        $stmt->bindParam(":delprovince", $delprovince, PDO::PARAM_STR);   
        $stmt->bindParam(":delsubdistrict", $delsubdistrict, PDO::PARAM_STR);   
        $stmt->bindParam(":deldistrict", $deldistrict, PDO::PARAM_STR);                
        $stmt->bindParam(":delzipcode", $delzipcode, PDO::PARAM_STR);        
        $stmt->bindParam(":tel", $tel, PDO::PARAM_STR);
        $stmt->bindParam(":fax", $fax, PDO::PARAM_STR);
        $stmt->bindParam(":contact", $contact, PDO::PARAM_STR);        
        $stmt->bindParam(":email", $email, PDO::PARAM_STR);        
        $stmt->bindParam(":remark", $remark, PDO::PARAM_STR);        
        $stmt->bindParam(":active_status", $active_status, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT); 
        $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);  


        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("id" => $_PUT)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = " SELECT a.* ";
        $sql .= " FROM `customer` as a ";
        $sql .= " where cuscode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => $res));
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
