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

        $code = request_dncode($conn);
        // var_dump($_POST);
        $sql = "insert dnmaster 
        (dncode,dndate,cuscode,remark,status, created_date,created_by,updated_date,updated_by, srcode) 
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        $status = "Y"; 
        $stmt->bindParam(1, $code, PDO::PARAM_STR);
        $stmt->bindValue(2, $header->dndate, PDO::PARAM_STR);
        $stmt->bindValue(3, $header->cuscode, PDO::PARAM_STR);
        $stmt->bindValue(4, $header->description, PDO::PARAM_STR);
        $stmt->bindValue(5, $status, PDO::PARAM_STR);
        $stmt->bindValue(6, $action_date, PDO::PARAM_STR);
        $stmt->bindValue(7, $action_user, PDO::PARAM_INT);
        $stmt->bindValue(8, $action_date, PDO::PARAM_STR);
        $stmt->bindValue(9, $action_user, PDO::PARAM_INT);
        $stmt->bindValue(10, $header->srcode, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        // var_dump($master); exit;

        $sql = "insert into dndetail 
        (stcode,stname,qty,remark,approved_date,approved_by,created_date,created_by,dncode) 
        values (:stcode,:stname,:qty,:remark,:approved_date,:approved_by,:action_date,:action_user,:dncode)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $seq = $ind + 1;
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":stname", $val->stname, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":remark", $val->remark, PDO::PARAM_STR);
            $stmt->bindParam(":approved_date", $val->approved_date, PDO::PARAM_STR);
            $stmt->bindParam(":approved_by", $val->approved_by, PDO::PARAM_INT);
            $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt->bindParam(":dncode", $code, PDO::PARAM_STR);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }

            $sql = "
            update spmaster 
            set
            spstatus = 'complete',   
            updated_date = :action_date, 
            updated_by = :action_user
            where spcode = :spcode"; 
            $stmt_sp = $conn->prepare($sql);
            if(!$stmt_sp) throw new PDOException("Update data error => {$conn->errorInfo()}"); 

            $stmt_sp->bindValue(":spcode", $val->spcode, PDO::PARAM_STR); 
            $stmt_sp->bindValue(":action_date", $action_date, PDO::PARAM_STR); 
            $stmt_sp->bindValue(":action_user", $action_user, PDO::PARAM_INT); 
            if(!$stmt_sp->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        } 


        if(!empty($header->srcode)){
            $sql = "
            update srmaster 
            set
            srstatus = 'complete',   
            updated_date = :action_date, 
            updated_by = :action_user
            where srcode = :srcode"; 
            $stmt = $conn->prepare($sql);
            if(!$stmt) throw new PDOException("Update data error => {$conn->errorInfo()}"); 

            $stmt->bindValue(":srcode", $header->srcode, PDO::PARAM_STR); 
            $stmt->bindValue(":action_date", $action_date, PDO::PARAM_STR); 
            $stmt->bindValue(":action_user", $action_user, PDO::PARAM_INT); 
    
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }      
        }

        update_dncode($conn);
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

        // var_dump($_POST);
        $sql = "
        update dnmaster 
        set
        dndate = :dndate,
        cuscode = :cuscode,
        srcode = :srcode,
        remark = :description, 
        updated_date = :action_date, 
        updated_by = :action_user
        where dncode = :dncode";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        // $master->srstatus = "Y"; 
        $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
        $stmt->bindValue(":dndate", $header->dndate, PDO::PARAM_STR); 
        $stmt->bindValue(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindValue(":srcode", $header->srcode, PDO::PARAM_STR);
        $stmt->bindValue(":description", $header->description, PDO::PARAM_STR); 
        $stmt->bindValue(":action_date", $action_date, PDO::PARAM_STR); 
        $stmt->bindValue(":action_user", $action_user, PDO::PARAM_INT); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from dndetail where dncode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $header->dncode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into dndetail 
        (stcode,stname,qty,remark,approved_date,approved_by,created_date,created_by,dncode) 
        values (:stcode,:stname,:qty,:remark,:approved_date,:approved_by,:action_date,:action_user,:dncode)";
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $seq = $ind + 1;
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":stname", $val->stname, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_INT);
            $stmt->bindParam(":remark", $val->remark, PDO::PARAM_STR);
            $stmt->bindParam(":approved_date", $val->approved_date, PDO::PARAM_STR);
            $stmt->bindParam(":approved_by", $val->approved_by, PDO::PARAM_INT);
            $stmt->bindParam(":action_date", $action_date, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        // $sql = "delete from dnmaster where dncode = :id";
        // $stmt = $conn->prepare($sql); 
        // if (!$stmt->execute([ 'id' => $code ])){
        //     $error = $conn->errorInfo();
        //     throw new PDOException("Remove data error => $error");
        // }            
        
        // $sql = "delete from dndetail where dncode = :id";
        // $stmt = $conn->prepare($sql); 
        // if (!$stmt->execute([ 'id' => $code ])){
        //     $error = $conn->errorInfo();
        //     throw new PDOException("Remove data error => $error");
        // }
        
        $sql = "update dnmaster set status = 'N' where dncode = :id";
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
        a.*,
        c.cusname,
        ifnull( c.delidno, ifnull(c.idno, '') ) idno,
        ifnull( c.delroad, ifnull(c.road, '') ) road,
        ifnull( c.delcountry, ifnull(c.country, '') ) country,
        ifnull( c.delsubdistrict, ifnull(c.subdistrict, '') ) subdistrict,
        ifnull( c.deldistrict, ifnull(c.district, '') ) district,
        ifnull( c.delprovince, ifnull(c.province, '') ) province,
        ifnull( c.delzipcode, ifnull(c.zipcode, '') ) zipcode,
        c.tel,
        c.fax,
        c.contact,
        IFNULL(a.remark, '') description,
        concat(u.firstname, ' ', u.lastname) created_name
        FROM dnmaster a
        left join customer c on a.cuscode = c.cuscode
        left join user u on a.created_by = u.code 
        where a.dncode = :code;";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "
        select 
        a.*,
        concat(u.firstname, ' ', u.lastname) approved_name
        from dndetail a
        left join user u on a.approved_by = u.code
        where dncode = :code
        order by a.id asc";
        
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
