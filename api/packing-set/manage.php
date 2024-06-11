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

    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        $sql = "insert packingset (
            packingset_name, packingset_groupid, unit_cost,fill_volume,declared,remark,labour_cost,overhead,packing_labour_cost,
            dimension,
            created_date,updated_date,created_by,updated_by
        ) 
        values (
            :packingset_name,:packingset_groupid,:unit_cost,:fill_volume,:declared,:remark,:labour_cost,:overhead,:packing_labour_cost,
            :dimension,
            CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(),:action_user,:action_user
        )";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header;  
        $stmt->bindParam(":packingset_name", $header->packingset_name, PDO::PARAM_STR);
        $stmt->bindParam(":packingset_groupid", $header->packingset_groupid, PDO::PARAM_INT);
        $stmt->bindParam(":unit_cost", $header->unit_cost, PDO::PARAM_STR);
        $stmt->bindParam(":fill_volume", $header->fill_volume, PDO::PARAM_STR);
        $stmt->bindParam(":declared", $header->declared, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT); 
        $stmt->bindParam(":labour_cost", $header->labour_cost, PDO::PARAM_STR);
        $stmt->bindParam(":overhead", $header->overhead, PDO::PARAM_STR);
        $stmt->bindParam(":dimension", $header->dimension, PDO::PARAM_STR);
        $stmt->bindParam(":packing_labour_cost", $header->packing_labour_cost, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $id = $conn->lastInsertId();
        // var_dump($master); exit;

        $sql = "insert into packingset_detail (packingsetid,pkid,pcs_carton,created_by,created_date)
        values (:packingsetid,:pkid,:pcs_carton,:action_user,CURRENT_TIMESTAMP())";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":packingsetid", $id, PDO::PARAM_INT);
            $stmt->bindParam(":pkid", $val->id, PDO::PARAM_STR);
            $stmt->bindParam(":pcs_carton", $val->pcs_carton, PDO::PARAM_INT); 
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 

        $sql = "insert into packingset_loadingtype (packingsetid,loadingtype_name,qty)
        values (:packingsetid,trim(:loadingtype_name),:qty)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $loadingtype as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":packingsetid", $id, PDO::PARAM_INT);
            $stmt->bindParam(":loadingtype_name", $val->loadingtype_name, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);  
            if(!$stmt->execute()) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        } 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $id)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        $sql = "
        update packingset 
        set
        packingset_name = :packingset_name,
        packingset_groupid = :packingset_groupid,
        unit_cost = :unit_cost,
        fill_volume = :fill_volume,
        declared = :declared,
        labour_cost = :labour_cost,
        overhead = :overhead,
        packing_labour_cost = :packing_labour_cost,
        remark = :remark,
        dimension = :dimension,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where id = :id";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        // $master->srstatus = "Y"; 
        $stmt->bindParam(":packingset_name", $header->packingset_name, PDO::PARAM_STR);
        $stmt->bindParam(":packingset_groupid", $header->packingset_groupid, PDO::PARAM_INT);
        $stmt->bindParam(":unit_cost", $header->unit_cost, PDO::PARAM_STR);
        $stmt->bindParam(":fill_volume", $header->fill_volume, PDO::PARAM_STR);
        $stmt->bindParam(":declared", $header->declared, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);  
        $stmt->bindParam(":id", $header->id, PDO::PARAM_INT); 
        $stmt->bindParam(":labour_cost", $header->labour_cost, PDO::PARAM_STR);
        $stmt->bindParam(":overhead", $header->overhead, PDO::PARAM_STR);
        $stmt->bindParam(":packing_labour_cost", $header->packing_labour_cost, PDO::PARAM_STR);
        $stmt->bindParam(":dimension", $header->dimension, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from packingset_detail where packingsetid = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $header->id ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into packingset_detail (packingsetid,pkid,pcs_carton,created_by,created_date)
        values (:packingsetid,:pkid,:pcs_carton,:action_user,CURRENT_TIMESTAMP())";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

       // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":packingsetid", $header->id, PDO::PARAM_INT);
            $stmt->bindParam(":pkid", $val->id, PDO::PARAM_STR);
            $stmt->bindParam(":pcs_carton", $val->pcs_carton, PDO::PARAM_INT);
            $stmt->bindParam(":action_user", $val->remark, PDO::PARAM_STR);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 

        $sql = "delete from packingset_loadingtype where packingsetid = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $header->id ])) throw new PDOException("Remove data error => {$conn->errorInfo()}");

        $sql = "insert into packingset_loadingtype (packingsetid,loadingtype_name,qty)
        values (:packingsetid,trim(:loadingtype_name),:qty)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        foreach( $loadingtype as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":packingsetid", $header->id, PDO::PARAM_INT);
            $stmt->bindParam(":loadingtype_name", $val->loadingtype_name, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);  
            if(!$stmt->execute()) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];

        $sql = "delete from packingset where id = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $code ])) throw new PDOException("Remove data error => {$conn->errorInfo()}");

        $sql = "delete from packingset_detail where packingsetid = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $code ])) throw new PDOException("Remove data error => {$conn->errorInfo()}");

        $sql = "delete from packingset_loadingtype where packingsetid = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $code ])) throw new PDOException("Remove data error => {$conn->errorInfo()}");

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = "select 
        p.*,
        pg.packingset_group
        from packingset p
        left join packingset_group pg on p.packingset_groupid = pg.id
        where p.id = :id";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "select  
        p.packingsetid,
        p.pkid,
        p.pcs_carton,
        p.created_date,
        p.created_by,
        p2.pkcode,
        p2.pkname,
        p2.pknameTH,
        p2.expscode,
        p2.expsname,
        p2.price,
        p2.transport,
        p2.lost,
        p2.cost,
        p2.id,
        p2.weight_unit
        from packingset_detail p
        join pkmaster p2 on p.pkid = p2.id 
        where p.packingsetid = :id";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sql = "select pl.* from packingset_loadingtype pl where pl.packingsetid = :id";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $loadingtype = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array( "header" => $header, "detail" => $detail, "loadingtype" => $loadingtype )));
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