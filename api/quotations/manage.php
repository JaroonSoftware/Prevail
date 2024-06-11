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
        $sql = "insert qtmaster (`qtcode`, `qtdate`, `cuscode`,
        `payment`, `total_price`, `vat`, `grand_total_price`,`remark`,created_by,updated_by) 
        values (:qtcode,:qtdate,:cuscode,:payment,:total_price,:vat,:grand_total_price,
        :remark,:action_user,:action_user)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header;  
        $stmt->bindParam(":qtcode", $header->qtcode, PDO::PARAM_STR);
        $stmt->bindParam(":qtdate", $header->qtdate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":vat", $header->vat, PDO::PARAM_STR);
        $stmt->bindParam(":grand_total_price", $header->grand_total_price, PDO::PARAM_STR); 
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql2 = " update options set qtcode = qtcode+1 WHERE year= '".date("Y")."' ";        

        $stmt2 = $conn->prepare($sql2);
        if(!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        if(!$stmt2->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $code = $conn->lastInsertId();
        // var_dump($master); exit;
        
        $sql = "insert into qtdetail (qtcode,stcode,qty,price,unit,discount)
        values (:qtcode,:stcode,:qty,:price,:unit,:discount)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":qtcode", $header->qtcode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_INT);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);            
            $stmt->bindParam(":discount", $val->discount, PDO::PARAM_INT);
            
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
        update qtmaster 
        set
        cuscode = :cuscode,
        payment = :payment,
        total_price = :total_price,
        vat = :vat,
        grand_total_price = :grand_total_price,
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where qtcode = :qtcode";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 

        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":payment", $header->payment, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":vat", $header->vat, PDO::PARAM_STR);
        $stmt->bindParam(":grand_total_price", $header->grand_total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);  
        $stmt->bindParam(":qtcode", $header->qtcode, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from qtdetail where qtcode = :qtcode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'qtcode' => $header->qtcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into qtdetail (qtcode,stcode,unit,qty,price,discount)
        values (:qtcode,:stcode,:unit,:qty,:price,:discount)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":qtcode", $header->qtcode, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_INT);
            $stmt->bindParam(":discount", $val->discount, PDO::PARAM_INT);
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
        
        $sql = "delete from packingset where code = :code";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }            
        
        $sql = "delete from packingset_detail where packingsetcode = :code";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = "SELECT a.qtcode,a.qtdate,a.cuscode,c.prename,c.cusname,CONCAT(c.idno ,' ', c.road,' ', c.subdistrict,' ', c.district,' ', c.zipcode) as address
        ,c.zipcode,c.contact,c.tel,c.fax,a.payment,a.total_price,a.vat,a.grand_total_price,a.remark ";
        $sql .= " FROM `qtmaster` as a ";
        $sql .= " inner join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " where a.qtcode = :code";

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.qtcode,a.stcode, a.price, a.discount, a.unit, a.qty ,i.stname ";
        $sql .= " FROM `qtdetail` as a inner join `items` as i on (a.stcode=i.stcode)  ";        
        $sql .= " where a.qtcode = :code";
        
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