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
        $action_datetime = date("Y-m-d H:i:s");
        $action_username = $token->userid;

        $sql = " 
        insert spmaster ( 
            spcode, spdate, srcode, spname, pkcode, netweight, specific_gravity, 
            description, spstatus, 
            created_by, updated_by, created_date, updated_date, rev, approved_result, refcode, srdetailid,
            storage_conditions, shelf_life, shelf_life_unit, additional, allergen_standards, bbe_date, previous_code
        ) 
        values (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), 0, 'waiting_approve', ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $master = (object)$master; 
        $master->srstatus = "Y"; 
        $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
        $stmt->bindValue( 2, $master->spdate, PDO::PARAM_STR);
        $stmt->bindValue( 3, $master->srcode, PDO::PARAM_STR);
        $stmt->bindValue( 4, $master->spname, PDO::PARAM_STR);
        $stmt->bindValue( 5, $master->pkcode, PDO::PARAM_STR);
        $stmt->bindValue( 6, $master->netweight, PDO::PARAM_STR);
        $stmt->bindValue( 7, $master->specific_gravity, PDO::PARAM_STR);
        $stmt->bindValue( 8, $master->description, PDO::PARAM_STR);
        $stmt->bindValue( 9, $action_username, PDO::PARAM_INT);
        $stmt->bindValue(10, $action_username, PDO::PARAM_INT);
        $stmt->bindValue(11, $master->refcode, PDO::PARAM_STR); 
        $stmt->bindValue(12, $master->srdetailid, PDO::PARAM_INT);
        $stmt->bindValue(13, $master->storage_conditions, PDO::PARAM_STR);
        $stmt->bindValue(14, $master->shelf_life, PDO::PARAM_INT);
        $stmt->bindValue(15, $master->shelf_life_unit, PDO::PARAM_STR);
        $stmt->bindValue(16, $master->additional, PDO::PARAM_STR);
        $stmt->bindValue(17, $master->allergen_standards, PDO::PARAM_STR);
        $stmt->bindValue(18, $master->bbe_date, PDO::PARAM_STR);
        $stmt->bindValue(19, $master->previous_code, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "insert into spdetail 
        (spcode, spno, stcode, amount, percent, totalpercent, `method`, stepno, amount_total, amount_after_lost, lost, created_date, created_by) 
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $spno = $ind + 1;
            $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
            $stmt->bindValue( 2, $spno, PDO::PARAM_STR);
            $stmt->bindValue( 3, $val->stcode, PDO::PARAM_STR);
            $stmt->bindValue( 4, $val->amount, PDO::PARAM_STR);
            $stmt->bindValue( 5, $val->percent, PDO::PARAM_STR);
            $stmt->bindValue( 6, $val->totalpercent, PDO::PARAM_STR);
            $stmt->bindValue( 7, $val->method, PDO::PARAM_STR);
            $stmt->bindValue( 8, $val->stepno, PDO::PARAM_STR);
            $stmt->bindValue( 9, $val->amount_total, PDO::PARAM_STR);
            $stmt->bindValue(10, $val->amount_after_lost, PDO::PARAM_STR);
            $stmt->bindValue(11, $val->lost, PDO::PARAM_STR); 
            $stmt->bindValue(12, $action_username, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 

        $sql = "insert into spparameter 
        (spcode, paraname, preparation, cutout, created_date, created_by, updated_date, updated_by, remark, seq) 
        values (?, ?, ?, ?, CURRENT_TIMESTAMP(), ?, CURRENT_TIMESTAMP(), ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        $params = $params;  
        foreach( $params as $ind => $val){
            $val = (object)$val;
            if( empty($val->paraname) ) continue;
            $seq = $ind + 1;
            $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
            $stmt->bindValue( 2, $val->paraname, PDO::PARAM_STR);
            $stmt->bindValue( 3, $val->preparation, PDO::PARAM_STR);
            $stmt->bindValue( 4, $val->cutout, PDO::PARAM_STR);  
            $stmt->bindValue( 5, $action_username, PDO::PARAM_INT);  
            $stmt->bindValue( 6, $action_username, PDO::PARAM_INT);
            $stmt->bindValue( 7, $val->remark, PDO::PARAM_STR);
            $stmt->bindValue( 8, $seq, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 

        $stmt = $conn->prepare("delete from sptags where spcode = :id"); 
        if (!$stmt->execute([ 'id' => $master->spcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove tags data error => $error");
        }

        $sql = "insert sptags (spcode, tags, created_by, created_date) values (?, ?, ?, CURRENT_TIMESTAMP())"; 
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        foreach( $tags as $ind => $val){ 
            $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
            $stmt->bindValue( 2, $val, PDO::PARAM_STR);
            $stmt->bindValue( 3, $action_username, PDO::PARAM_STR);    
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }         
        }

        update_spcode($conn); 
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $master->srcode)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){ 
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");
        $action_datetime = date("Y-m-d H:i:s"); 
        $action_username = intval( $token->userid ?? 0 );

        // var_dump($action_username, $action_datetime); exit;
        $sql = "
        update spmaster set
        srcode = :srcode,
        spname = :spname,
        spdate = :spdate,
        pkcode = :pkcode,
        netweight = :netweight,
        specific_gravity = :specific_gravity,
        srdetailid = :srdetailid,
        description = :description, 
        updated_date = :updated_date,  
        updated_by = :updated_by,
        shelf_life = :shelf_life,
        shelf_life_unit = :shelf_life_unit,
        storage_conditions = :storage_conditions,
        additional = :additional,
        allergen_standards = :allergen_standards,
        bbe_date = :bbe_date,
        previous_code = :previous_code
        where spcode = :spcode
        ";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $master = (object)$master; 
        // $master->srstatus = "Y";
        $stmt->bindParam(":srcode", $master->srcode, PDO::PARAM_STR);
        $stmt->bindParam(":spname", $master->spname, PDO::PARAM_STR);
        $stmt->bindValue(":spdate", $master->spdate, PDO::PARAM_STR);
        $stmt->bindValue(":pkcode", $master->pkcode, PDO::PARAM_STR);
        $stmt->bindValue(":netweight", $master->netweight, PDO::PARAM_STR);
        $stmt->bindValue(":specific_gravity", $master->specific_gravity, PDO::PARAM_STR);
        $stmt->bindValue(":description", $master->description, PDO::PARAM_STR);
        $stmt->bindValue(":updated_date", $action_datetime, PDO::PARAM_STR);
        $stmt->bindValue(":updated_by", $action_username, PDO::PARAM_INT);
        $stmt->bindValue(":spcode", $master->spcode, PDO::PARAM_STR); 
        $stmt->bindValue(":srdetailid", $master->srdetailid, PDO::PARAM_INT);
        $stmt->bindValue(":shelf_life", $master->shelf_life, PDO::PARAM_INT); 
        $stmt->bindValue(":shelf_life_unit", $master->shelf_life_unit, PDO::PARAM_STR); 
        $stmt->bindValue(":storage_conditions", $master->storage_conditions, PDO::PARAM_STR); 
        $stmt->bindValue(":additional", $master->additional, PDO::PARAM_STR); 
        $stmt->bindValue(":allergen_standards", $master->allergen_standards, PDO::PARAM_STR); 
        $stmt->bindValue(":bbe_date", $master->bbe_date, PDO::PARAM_STR); 
        $stmt->bindValue(":previous_code", $master->previous_code, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }
        // var_dump($master); exit;

        $sql = "delete from spdetail where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $master->spcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into spdetail 
        (spcode, spno, stcode, amount, percent, totalpercent, `method`, stepno, amount_total, amount_after_lost, lost, created_date, created_by) 
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $spno = $ind + 1;
            $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
            $stmt->bindValue( 2, $spno, PDO::PARAM_STR);
            $stmt->bindValue( 3, $val->stcode, PDO::PARAM_STR);
            $stmt->bindValue( 4, $val->amount, PDO::PARAM_STR);
            $stmt->bindValue( 5, $val->percent, PDO::PARAM_STR);
            $stmt->bindValue( 6, $val->totalpercent, PDO::PARAM_STR);
            $stmt->bindValue( 7, $val->method, PDO::PARAM_STR);
            $stmt->bindValue( 8, $val->stepno, PDO::PARAM_STR);
            $stmt->bindValue( 9, $val->amount_total, PDO::PARAM_STR);
            $stmt->bindValue(10, $val->amount_after_lost, PDO::PARAM_STR);
            $stmt->bindValue(11, $val->lost, PDO::PARAM_STR); 
            $stmt->bindValue(12, $action_username, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }        
        } 


        $sql = "delete from spparameter where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $master->spcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into spparameter 
        (spcode, paraname, preparation, cutout, created_date, created_by, updated_date, updated_by, remark, seq) 
        values (?, ?, ?, ?, CURRENT_TIMESTAMP(), ?, CURRENT_TIMESTAMP(), ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        $params = $params;  
        foreach( $params as $ind => $val){
            $val = (object)$val;
            $seq = $ind + 1;
            $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
            $stmt->bindValue( 2, $val->paraname, PDO::PARAM_STR);
            $stmt->bindValue( 3, $val->preparation, PDO::PARAM_STR);
            $stmt->bindValue( 4, $val->cutout, PDO::PARAM_STR);  
            $stmt->bindValue( 5, $action_username, PDO::PARAM_INT);  
            $stmt->bindValue( 6, $action_username, PDO::PARAM_INT);
            $stmt->bindValue( 7, $val->remark, PDO::PARAM_STR);
            $stmt->bindValue( 8, $seq, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 

        $stmt = $conn->prepare("delete from sptags where spcode = :id"); 
        if (!$stmt->execute([ 'id' => $master->spcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove tags data error => $error");
        }

        $sql = "insert sptags (spcode, tags, created_by, created_date) values (?, ?, ?, CURRENT_TIMESTAMP())"; 
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        foreach( $tags as $ind => $val){ 
            $stmt->bindParam( 1, $master->spcode, PDO::PARAM_STR);
            $stmt->bindValue( 2, $val, PDO::PARAM_STR);
            $stmt->bindValue( 3, $action_username, PDO::PARAM_STR);    
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $master->srcode)));
    } else if($_SERVER["REQUEST_METHOD"] == "DELETE"){ 
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from spmaster where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove master data error => $error");
        }
        
        $sql = "delete from spdetail where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove detail data error => $error");
        }

        $sql = "delete from spparameter where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove parameter data error => $error");
        }

        $sql = "delete from sptags where spcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove parameter data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = "
        SELECT
        a.srcode,
        a.spdate,
        a.spcode,
        a.spname,
        a.pkcode,
        a.netweight,
        a.specific_gravity,
        a.spstatus,
        a.srdetailid,
        b.cuscode,
        c.cusname,
        a.created_by,
        u.firstname,
        u.lastname,
        concat(u.firstname, ' ', u.lastname) created_name,
        IFNULL(a.description, '') description,
        a.approved_result,
        a.approved_by,
        concat(u2.firstname, ' ', u2.lastname) approved_name,
        a.approved_date,
        a.approved_remark,
        i.pkname,
        a.storage_conditions,
        a.shelf_life,
        a.shelf_life_unit,
        a.additional,
        a.allergen_standards,
        a.bbe_date,
        a.cusapproved_status,
        a.previous_code,
        a.frmcode
        FROM spmaster a
        left join srmaster b on a.srcode =  b.srcode
        left join customer c on b.cuscode = c.cuscode 
        left join user u on a.created_by  = u.code
        left join user u2 on a.approved_by = u2.code
        left join pkmaster i on a.pkcode  = i.expscode
        where a.spcode = :code
        order by a.spcode desc;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting master data error => $error");
        }
        $master = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "
        select 
        a.*, i.stname, i.yield, i.multiply, price
        from spdetail a 
        left join items i on a.stcode = i.stcode
        where a.spcode = :code order by a.stepno asc, spno asc;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting detail data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sql = "select * from spparameter a where a.spcode = :code order by seq asc;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting parameter data error => $error");
        }
        $params = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sql = "select * from sptags a where a.spcode = :code order by id asc;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting parameter data error => $error");
        }
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("master"=>$master, "detail"=>$detail, "params" => $params, "tags" => $tags ) ));
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





