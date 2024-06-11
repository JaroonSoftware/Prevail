<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");
        $action_date = date("Y-m-d H:i:s"); 
        $action_user = $token->userid; 
        $header = (object)$header; 
        $sql = "select if(count(id) > 0, true, false) result from shippingtype where trim(replace(shippingtype_name, ' ', '')) = trim(replace(:shippingtype_name, ' ', ''))";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'shippingtype_name' => $header->shippingtype_name ])) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $check_dupname = (object)$stmt->fetch(PDO::FETCH_ASSOC);
        if( !!$check_dupname->result ) throw new PDOException("Loading type name duplicate"); 


        // var_dump($_POST);
        $sql = "insert shippingtype (shippingtype_name,status,created_by,updated_by,remark) 
        values ( trim(:shippingtype_name),:status,:actionby,:actionby,:remark)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 


        $status = "Y"; 
        $stmt->bindParam(':shippingtype_name', $header->shippingtype_name, PDO::PARAM_STR);
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':remark', $header->remark, PDO::PARAM_STR);
        $stmt->bindValue(':actionby', $action_user, PDO::PARAM_INT); 

        if(!$stmt->execute()) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $shippingtypeId = $conn->lastInsertId();

        $sql = "insert shippingtype_terms (expense_name,shippingtype_id,price) values (trim(:expense_name),:shippingtype_id,:price)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");
        
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":expense_name", $val->expense_name, PDO::PARAM_STR);
            $stmt->bindParam(":shippingtype_id", $shippingtypeId, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR); 
            if(!$stmt->execute())  throw new PDOException("Insert data error => {$conn->errorInfo()}");
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");
        $action_date = date("Y-m-d");
        $action_time = date("H:i:s");
        $action_user = $token->userid;
        $header = (object)$header; 
        $sql = "select if(count(id) > 0, true, false) result from shippingtype where trim(replace(shippingtype_name, ' ', '')) = trim(replace(:shippingtype_name, ' ', '')) and id <> :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'shippingtype_name' => $header->shippingtype_name, 'id' => $header->id ])) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        
        $check_dupname = (object)$stmt->fetch(PDO::FETCH_ASSOC);
        if( !!$check_dupname->result ) throw new PDOException("Loading type name duplicate"); 

        $sql = "
        update shippingtype
        set
        shippingtype_name = trim(:shippingtype_name),
        remark = :remark, 
        updated_date = CURRENT_TIMESTAMP(), 
        updated_by = :actionby
        where id = :id";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 


        $stmt->bindParam(':shippingtype_name', $header->shippingtype_name, PDO::PARAM_STR);
        // $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':remark', $header->remark, PDO::PARAM_STR);
        $stmt->bindValue(':actionby', $action_user, PDO::PARAM_INT);
        $stmt->bindValue(':id', $header->id, PDO::PARAM_INT);

        if(!$stmt->execute()) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $sql = "delete from shippingtype_terms where shippingtype_id = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $header->id ])) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $sql = "insert shippingtype_terms (expense_name,shippingtype_id,price) values (trim(:expense_name),:shippingtype_id,:price)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");
        
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":expense_name", $val->expense_name, PDO::PARAM_STR);
            $stmt->bindParam(":shippingtype_id", $header->id, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR); 
            if(!$stmt->execute())  throw new PDOException("Insert data error => {$conn->errorInfo()}");
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "update shippingtype set status = 'N' where id = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"];
        $sql = "select s.* from shippingtype s where s.id = :code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo();
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $loading = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "select s.* from shippingtype_terms s where s.shippingtype_id = :code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo();
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $shipping = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array( "loading" => $loading, "shipping" =>  $shipping )));
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