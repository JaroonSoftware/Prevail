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
        
        $sql = "INSERT INTO supplier (`supcode`, `prename`, `supname`, `taxnumber`, `idno`,`road`, `province`, 
        `subdistrict`,`district`,`zipcode`, `tel`, `fax`,`contact`, `email`,`remark`, `active_status`, created_by, created_date) 
        values (:supcode,:prename,:supname,:taxnumber,:idno,:road,:province,:subdistrict,:district,:zipcode,
        :tel,:fax,:contact,:email,:remark,'Y',:action_user,:action_date)";
        
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        
        $header = (object)$header;
        $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
        $stmt->bindParam(":prename", $header->prename, PDO::PARAM_STR);
        $stmt->bindParam(":supname", $header->supname, PDO::PARAM_STR);     
        $stmt->bindParam(":taxnumber", $header->taxnumber, PDO::PARAM_STR);
        $stmt->bindParam(":idno", $header->idno, PDO::PARAM_STR); 
        $stmt->bindParam(":road", $header->road, PDO::PARAM_STR);         
        $stmt->bindParam(":province", $header->province, PDO::PARAM_STR);   
        $stmt->bindParam(":subdistrict", $header->subdistrict, PDO::PARAM_STR);   
        $stmt->bindParam(":district", $header->district, PDO::PARAM_STR);                
        $stmt->bindParam(":zipcode", $header->zipcode, PDO::PARAM_STR);        
        $stmt->bindParam(":tel", $header->tel, PDO::PARAM_STR);
        $stmt->bindParam(":fax", $header->fax, PDO::PARAM_STR);
        $stmt->bindParam(":contact", $header->contact, PDO::PARAM_STR);        
        $stmt->bindParam(":email", $header->email, PDO::PARAM_STR);        
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);        
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT); 
        $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);  

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "insert into supplier_items (supcode,stcode)  
        values (:supcode,:stcode) ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;

            $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }
        
        $strSQL = "UPDATE supcode SET ";
        $strSQL .= " number= number+1 ";
        $strSQL .= " order by id desc LIMIT 1 ";

        $stmt3 = $conn->prepare($strSQL);
        if ($stmt3->execute()) {
            $conn->commit();
            http_response_code(200);
            echo json_encode(array("data"=> array("id" => "ok", 'message' => 'เพิ่มผู้ขายสำเร็จ')));
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
        update supplier 
        set
        supcode = :supcode,
        prename = :prename,
        supname = :supname,
        taxnumber = :taxnumber,
        idno = :idno,
        road = :road,
        province = :province,
        subdistrict = :subdistrict,
        district = :district,
        zipcode = :zipcode,
        tel = :tel,
        fax = :fax,
        contact = :contact,
        email = :email,
        remark = :remark,
        active_status = :active_status,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where supcode = :supcode";

        
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
        $stmt->bindParam(":prename", $header->prename, PDO::PARAM_STR);
        $stmt->bindParam(":supname", $header->supname, PDO::PARAM_STR);     
        $stmt->bindParam(":taxnumber", $header->taxnumber, PDO::PARAM_STR);
        $stmt->bindParam(":idno", $header->idno, PDO::PARAM_STR); 
        $stmt->bindParam(":road", $header->road, PDO::PARAM_STR);         
        $stmt->bindParam(":province", $header->province, PDO::PARAM_STR);   
        $stmt->bindParam(":subdistrict", $header->subdistrict, PDO::PARAM_STR);   
        $stmt->bindParam(":district", $header->district, PDO::PARAM_STR);                
        $stmt->bindParam(":zipcode", $header->zipcode, PDO::PARAM_STR);       
        $stmt->bindParam(":tel", $header->tel, PDO::PARAM_STR);
        $stmt->bindParam(":fax", $header->fax, PDO::PARAM_STR);
        $stmt->bindParam(":contact", $header->contact, PDO::PARAM_STR);        
        $stmt->bindParam(":email", $header->email, PDO::PARAM_STR);        
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);        
        $stmt->bindParam(":active_status", $header->active_status, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $header->action_user, PDO::PARAM_INT); 
        $stmt->bindParam(":action_date", $header->action_date, PDO::PARAM_STR);  


        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }
        
        $sql = "delete from supplier_items where supcode = :supcode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['supcode' => $header->supcode])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into supplier_items (supcode,stcode)
        values (:supcode,:stcode)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("id" => $_PUT)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = " SELECT a.* ";
        $sql .= " FROM `supplier` as a ";
        $sql .= " where supcode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.supcode,a.stcode,i.stname ";
        $sql .= " FROM `supplier_items` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.supcode = :code";

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
