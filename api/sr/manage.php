<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");

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

        // var_dump($_POST);
        $sql = "insert srmaster 
        (srcode,srdate,cuscode,description,srstatus,created_date,created_by,updated_date,updated_by) 
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $master = (object)$master; 
        $srstatus = "pending"; 
        $stmt->bindParam(1, $master->srcode, PDO::PARAM_STR);
        $stmt->bindValue(2, $master->srdate, PDO::PARAM_STR);
        $stmt->bindValue(3, $master->cuscode, PDO::PARAM_STR);
        $stmt->bindValue(4, $master->description, PDO::PARAM_STR);
        $stmt->bindValue(5, $srstatus, PDO::PARAM_STR);
        $stmt->bindValue(6, $action_date, PDO::PARAM_STR);
        $stmt->bindValue(7, $action_user, PDO::PARAM_INT);
        $stmt->bindValue(8, $action_date, PDO::PARAM_STR);
        $stmt->bindValue(9, $action_user, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        // var_dump($master); exit;

        $sql = "insert into srdetail (srcode,spname,pkname,pkcode,amount,seq,created_date,created_by) values (:srcode,:spname,:pkname,:pkcode,:amount,:seq,:action_date,:action_user)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $seq = $ind + 1;
            $stmt->bindParam(":srcode", $master->srcode, PDO::PARAM_STR);
            $stmt->bindParam(":spname", $val->spname, PDO::PARAM_STR);
            $stmt->bindParam(":pkcode", $val->pkcode, PDO::PARAM_STR);
            $stmt->bindParam(":pkname", $val->pkname, PDO::PARAM_STR);
            $stmt->bindParam(":amount", $val->amount, PDO::PARAM_INT);
            $stmt->bindParam(":seq",    $seq, PDO::PARAM_INT);
            $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }        
        } 

        update_srcode($conn);
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $master->srcode)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");
        $action_date = date("Y-m-d");
        $action_time = date("H:i:s");
        $action_user = $token->userid;

        // var_dump($_POST);
        $sql = "
        update srmaster 
        set
        srdate = :srdate,
        duedate = :duedate,
        cuscode = :cuscode, 
        description = :description, 
        -- srstatus = :srstatus, 
        updated_date = :action_date, 
        updated_by = :action_user
        where srcode = :srcode";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $master = (object)$master; 
        // $master->srstatus = "Y"; 
        $stmt->bindParam(":srcode", $master->srcode, PDO::PARAM_STR);
        $stmt->bindValue(":srdate", $master->srdate, PDO::PARAM_STR);
        $stmt->bindValue(":duedate", $master->duedate, PDO::PARAM_STR);
        $stmt->bindValue(":cuscode", $master->cuscode, PDO::PARAM_STR);
        $stmt->bindValue(":description", $master->description, PDO::PARAM_STR); 
        $stmt->bindValue(":action_date", $action_date, PDO::PARAM_STR); 
        $stmt->bindValue(":action_user", $action_user, PDO::PARAM_INT); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from srdetail where srcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $master->srcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into srdetail (srcode,spname,pkname,pkcode,amount,seq,created_date,created_by) values (:srcode,:spname,:pkname,:pkcode,:amount,:seq,:action_date,:action_user)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $seq = $ind + 1;
            $stmt->bindParam(":srcode", $master->srcode, PDO::PARAM_STR);
            $stmt->bindParam(":spname", $val->spname, PDO::PARAM_STR);
            $stmt->bindParam(":pkname", $val->pkname, PDO::PARAM_STR);
            $stmt->bindParam(":pkcode", $val->pkcode, PDO::PARAM_STR);
            $stmt->bindParam(":amount", $val->amount, PDO::PARAM_STR);
            $stmt->bindParam(":seq",    $seq, PDO::PARAM_INT);
            $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }        
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $master->srcode)));
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from srmaster where srcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }            
        
        $sql = "delete from srdetail where srcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = "
        select
        a.srcode,
        a.srdate,
        a.duedate,
        a.srstatus,
        a.cuscode,
        c.cusname,
        IFNULL(a.description, '') description
        FROM srmaster a
        join customer c on a.cuscode = c.cuscode
        where a.srcode = :code
        order by a.srcode desc;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $master = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "select * from srdetail where srcode = :code";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array( "master" => $master, "detail" => $detail )));
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





