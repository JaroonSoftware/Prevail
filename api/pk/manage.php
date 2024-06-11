<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_datetime = date("Y-m-d H:i:s");
    $action_username = $token->userid; 
    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");
        
        // var_dump($_POST);
        // PACK-000001
        $prefix = "PACK-";
        $sql = "insert pkmaster (
            pkcode,pkname,pknameTH,pktypeid,
            expscode,expsname,price,transport,lost,cost,
            unitid,supcode,remark,
            created_date,created_by,updated_date,updated_by,
            dimension,weight_unit
        ) 
        select 
        concat('$prefix', right( concat( '000000', max( cast( replace( pkcode, '$prefix', '') as SIGNED) ) + 1 ), 6 ) ),
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        CURRENT_TIMESTAMP(), ?, CURRENT_TIMESTAMP(), ?,
        ?, ?
        from pkmaster pm";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
 
        $stmt->bindParam( 1, $pkname, PDO::PARAM_STR);
        $stmt->bindValue( 2, $pknameTH, PDO::PARAM_STR);
        $stmt->bindParam( 3, $pktypeid, PDO::PARAM_INT);
        $stmt->bindValue( 4, $expscode, PDO::PARAM_STR);
        $stmt->bindParam( 5, $expsname, PDO::PARAM_STR);
        $stmt->bindValue( 6, $price, PDO::PARAM_STR);
        $stmt->bindParam( 7, $transport, PDO::PARAM_STR);
        $stmt->bindValue( 8, $lost, PDO::PARAM_STR);
        $stmt->bindParam( 9, $cost, PDO::PARAM_STR);
        $stmt->bindValue( 10, $unitid, PDO::PARAM_INT);
        $stmt->bindParam( 11, $supcode, PDO::PARAM_STR);
        $stmt->bindValue( 12, $remark, PDO::PARAM_STR);
        $stmt->bindValue( 13, $action_username, PDO::PARAM_INT);
        $stmt->bindValue( 14, $action_username, PDO::PARAM_INT);
        $stmt->bindValue( 15, $dimension, PDO::PARAM_STR);
        $stmt->bindValue( 16, $weight_unit, PDO::PARAM_STR);
        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error"); 
        }   
        $id = $conn->lastInsertId();
        $sql = "select * from pkmaster p where p.id = :id";
        $stmt = $conn->prepare($sql);  
        if (!$stmt->execute([ 'id' => $id ])) throw new PDOException("Insert data error => {$conn->errorInfo()}");
        $res = $stmt->fetch(PDO::FETCH_ASSOC);  

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $res)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_"); 

        // var_dump($_POST);
        $sql = "
        update pkmaster
        set
        pkname = :pkname,
        pknameTH = :pknameTH,
        pktypeid = :pktypeid,
        expscode = :expscode,
        expsname = :expsname,
        price = :price,
        transport = :transport,
        lost = :lost,
        cost = :cost,
        unitid = :unitid,
        supcode = :supcode,
        remark = :remark,
        dimension = :dimension,
        weight_unit = :weight_unit,
        updated_date = CURRENT_TIMESTAMP(), 
        updated_by = :action_user
        where id = :id";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        // $master->srstatus = "Y"; 
        $stmt->bindParam( ":pkname", $pkname, PDO::PARAM_STR);
        $stmt->bindValue( ":pknameTH", $pknameTH, PDO::PARAM_STR);
        $stmt->bindParam( ":pktypeid", $pktypeid, PDO::PARAM_INT);
        $stmt->bindValue( ":expscode", $expscode, PDO::PARAM_STR);
        $stmt->bindParam( ":expsname", $expsname, PDO::PARAM_STR);
        $stmt->bindValue( ":price", $price, PDO::PARAM_STR);
        $stmt->bindParam( ":transport", $transport, PDO::PARAM_STR);
        $stmt->bindValue( ":lost", $lost, PDO::PARAM_STR);
        $stmt->bindParam( ":cost", $cost, PDO::PARAM_STR);
        $stmt->bindValue( ":unitid", $unitid, PDO::PARAM_INT);
        $stmt->bindParam( ":supcode", $supcode, PDO::PARAM_STR);
        $stmt->bindValue( ":remark", $remark, PDO::PARAM_STR); 
        $stmt->bindValue( ":dimension", $dimension, PDO::PARAM_STR); 
        $stmt->bindValue( ":weight_unit", $weight_unit, PDO::PARAM_STR); 
        $stmt->bindValue(":action_user", $action_username, PDO::PARAM_INT);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $_PUT)));

    } else if($_SERVER["REQUEST_METHOD"] == "DELETE"){ 
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from pkmaster where id = :id";
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
        
        $sql = "select 
        p.*,
        pt.pktype,
        s.supname,
        un.unit
        from pkmaster p
        left join pktype pt on p.pktypeid = pt.id and pt.status = 'Y'
        left join supplier s on p.supcode = s.supcode
        left join unit un on p.unitid = un.unitcode        
        where p.id = :id";
        $stmt = $conn->prepare($sql);  
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        $res = $stmt->fetch(PDO::FETCH_ASSOC);  

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> $res));
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