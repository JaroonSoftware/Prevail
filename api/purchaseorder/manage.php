<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_date = date("Y-m-d H:i:s"); 
    $action_user = $token->userid;
    // echo $action_user;

    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        $sql = "insert pomaster (`pocode`, `podate`, `supcode`,
        `deldate`,`payment`,`poqua`, `total_price`,`remark`,created_by,updated_by) 
        values (:pocode,:podate,:supcode,:deldate,:payment,:poqua,:total_price,
        :remark,:action_user,:action_user)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header;  
        $stmt->bindParam(":pocode", $header->pocode, PDO::PARAM_STR);
        $stmt->bindParam(":podate", $header->podate, PDO::PARAM_STR);
        $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
        $stmt->bindParam(":deldate", $header->deldate, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":poqua", $header->poqua, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql2 = " update options set pocode = pocode+1 WHERE year= '".date("Y")."' ";        

        $stmt2 = $conn->prepare($sql2);
        if(!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        if(!$stmt2->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $code = $conn->lastInsertId();
        // var_dump($master); exit;
        
        $sql = "insert into podetail (pocode,stcode,qty,price,unit,discount,vat,recamount)
        values (:pocode,:stcode,:qty,:price,:unit,:discount,:vat,0)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":pocode", $header->pocode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":price", $val->buyprice, PDO::PARAM_INT);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);            
            $stmt->bindParam(":discount", $val->discount, PDO::PARAM_INT);
            $stmt->bindParam(":vat", $val->vat, PDO::PARAM_STR);
            
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("code" => $code)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);
        $sql = "
        update pomaster 
        set
        podate = :podate,
        supcode = :supcode,
        deldate = :deldate,        
        payment = :payment,
        poqua = :poqua,
        total_price = :total_price,
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where pocode = :pocode";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        
        $stmt->bindParam(":podate", $header->podate, PDO::PARAM_STR);
        $stmt->bindParam(":supcode", $header->supcode, PDO::PARAM_STR);
        $stmt->bindParam(":deldate", $header->deldate, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":poqua", $header->poqua, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);  
        $stmt->bindParam(":pocode", $header->pocode, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from podetail where pocode = :pocode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'pocode' => $header->pocode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into podetail (pocode,stcode,unit,qty,price,discount,vat,recamount)
        values (:pocode,:stcode,:unit,:qty,:price,:discount,:vat,:recamount)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":pocode", $header->pocode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":price", $val->buyprice, PDO::PARAM_INT);
            $stmt->bindParam(":discount", $val->discount, PDO::PARAM_INT);
            $stmt->bindParam(":vat", $val->vat, PDO::PARAM_INT);
            $stmt->bindParam(":recamount", $val->recamount, PDO::PARAM_INT);
            
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("code" => $code)));
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];

        $sql = "update pomaster set doc_status = 'ยกเลิก' where pocode = :code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status" => 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = " SELECT a.pocode,a.podate,a.supcode,c.prename,c.supname,CONCAT(COALESCE(c.idno, '') ,' ', COALESCE(c.road, ''),' ', COALESCE(c.subdistrict, ''),' ', COALESCE(c.district, ''),' ',COALESCE(c.zipcode, '') ) as address
        ,c.zipcode,c.contact,c.tel,c.fax,a.deldate,a.payment,a.poqua,a.total_price,a.remark,a.doc_status ";
        $sql .= " FROM `pomaster` as a ";
        $sql .= " left outer join `supplier` as c on (a.supcode)=(c.supcode)";
        $sql .= " where a.pocode = :code";

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.pocode,a.stcode, a.price as buyprice, a.discount,a.vat, a.unit, a.qty,i.stname,a.recamount ";
        $sql .= " FROM `podetail` as a inner join `items` as i on (a.stcode=i.stcode)  ";        
        $sql .= " where a.pocode = :code";
        $sql .= " order by i.seq";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array( "header" => $header, "detail" => $detail )));
    }

} catch (PDOException $e) { 
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) { 
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally{
    $conn = null;
}  
ob_end_flush(); 
exit;