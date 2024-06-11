<?php
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 
$conn->beginTransaction();
http_response_code(400);
if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_PUT = json_decode($rest_json, true); 
    extract($_PUT, EXTR_OVERWRITE, "_"); 
    try {  
        $action_datetime = date("Y-m-d H:i:s"); 
        $action_username = intval( $token->userid ?? 0 );

        $sql_duplicate_sp = "
        select
            concat(a.refcode,'-', (select max(rev) from spmaster where refcode = a.refcode ) + 1 ) spcode,
            DATE_FORMAT(now(), '%Y-%m-%d') spdate,
            a.srcode,
            a.spname,
            a.pkcode,
            a.netweight,
            a.specific_gravity,
            a.description,
            'pending' spstatus,
            now() updated_date, :action_by updated_by,
            now() created_date, :action_by created_by,
            null approved_date, null approved_by, 'waiting_approve' approved_result, 
            ((select max(rev) from spmaster where refcode = a.refcode ) + 1) rev, 
            null cancel_approved_date, null cancel_approved_by,
            a.refcode,
            :code frmcode,
            :code previous_code
        from spmaster a 
        where 1 = 1
            and a.spcode = :code
        order by updated_date desc limit 1;"; 
        $stmt = $conn->prepare($sql_duplicate_sp); 
        if (!$stmt->execute([ 'code' => $spcode, 'action_by' => $action_username ])){
            $error = $pdo->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting new code error => $error");
        } 
        $dup = $stmt->fetch(PDO::FETCH_ASSOC);
        $dup = (object)$dup;

        // var_dump($action_username, $action_datetime); exit;
        $sql = "insert into spmaster (
            spcode, spdate, srcode, spname, pkcode, netweight, specific_gravity, description, spstatus,
            created_date, created_by, updated_date, updated_by,
            approved_date, approved_by, approved_result,
            rev, cancel_approved_date, cancel_approved_by, refcode, frmcode, previous_code
        ) $sql_duplicate_sp";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Update data error => {$conn->errorInfo()}"); 

        $stmt->bindValue( ':action_by', $action_username, PDO::PARAM_INT);
        $stmt->bindValue( ':code', $spcode, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("cancel approved data error => $error");
            die;
        }

        $sql = "insert into spdetail (spcode,spno,stcode,amount,percent,totalpercent,`method`,stepno,amount_total,amount_after_lost,lost,created_date,created_by)
        select
            :dupcode spcode,
            spno,
            stcode,
            amount,
            percent,
            totalpercent,
            method,
            stepno,
            amount_total,
            amount_after_lost,
            lost,
            now(),
            :action_by created_by
        from spdetail s 
        where spcode = :code
        order by spno asc;";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'dupcode' => $dup->spcode ,'code' => $spcode, 'action_by' => $action_username ])){
            $error = $pdo->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting new code error => $error");
        }

        $sql = "insert into spparameter (spcode,paraname,preparation,cutout,created_date,created_by,updated_date,updated_by,remark,seq)
            select
            :dupcode spcode,
            paraname,
            preparation,
            cutout,
            now() created_date,
            :action_by created_by,
            now() updated_date,
            :action_by updated_by,
            remark,
            seq
        from spparameter
        where spcode = :code";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'dupcode' => $dup->spcode ,'code' => $spcode, 'action_by' => $action_username ])){
            $error = $pdo->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting new code error => $error");
        }

        $sql = "insert into sptags (spcode,tags,created_date,created_by)
        select 
        :dupcode spcode, tags, now() created_date, :action_by created_by
        from sptags
        where spcode = :code";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'dupcode' => $dup->spcode ,'code' => $spcode, 'action_by' => $action_username ])){
            $error = $pdo->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting new code error => $error");
        }

        //$conn->rollback();
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=>$spcode, "code" => $dup->spcode));
    } catch (mysqli_sql_exception $e) { 
        $conn->rollback();
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        $conn->rollback();
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        // Ignore
        $conn = null;
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
} 
ob_end_flush(); 
exit;
?>