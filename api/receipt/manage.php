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
        $sql = "insert receipt (`recode`, `redate`, `cuscode`, `ivcode`,
        `payment_type`,`price`,bank,thai_name,branch,check_no,check_date,check_amount,`remark`,created_by,updated_by) 
        values (:recode,:redate,:cuscode,:ivcode,:payment_type,:price,:bank,:thai_name,:branch,:check_no,:check_date,:check_amount,
        :remark,:action_user,:action_user)";
        
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header;  
        $stmt->bindParam(":recode", $header->recode, PDO::PARAM_STR);
        $stmt->bindParam(":redate", $header->redate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
        $stmt->bindParam(":payment_type", $header->payment_type, PDO::PARAM_STR);
        $stmt->bindParam(":price", $header->price, PDO::PARAM_STR);
        $stmt->bindParam(":bank", $header->bank, PDO::PARAM_STR);        
        $stmt->bindParam(":thai_name", $header->thai_name, PDO::PARAM_STR);        
        $stmt->bindParam(":branch", $header->branch, PDO::PARAM_STR);
        $stmt->bindParam(":check_no", $header->check_no, PDO::PARAM_STR);
        $stmt->bindParam(":check_date", $header->check_date, PDO::PARAM_STR);
        $stmt->bindParam(":check_amount", $header->check_amount, PDO::PARAM_STR);        
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        if ($header->balance == $header->price) {
            $sql = "
            update ivmaster 
            set
            doc_status = 'ชำระครบแล้ว',
            balance = balance-:price,
            updated_date = CURRENT_TIMESTAMP(),
            updated_by = :action_user
            where ivcode = :ivcode";

            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
            $stmt->bindParam(":price", $header->price, PDO::PARAM_STR);            

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
        }
        else{
            $sql = "
            update ivmaster 
            set
            doc_status = 'ชำระไม่ครบ',
            balance = balance-:price,
            updated_date = CURRENT_TIMESTAMP(),
            updated_by = :action_user
            where ivcode = :ivcode";

            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
            $stmt->bindParam(":price", $header->price, PDO::PARAM_STR);  

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
        }

        update_recode($conn);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("code" => $code)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);
        $sql = "
        update receipt 
        set
        redate = :redate,
        cuscode = :cuscode,
        ivcode = :ivcode,
        payment_type = :payment_type,
        price = :price,
        bank = :bank,
        thai_name = :thai_name,
        branch = :branch,
        check_no = :check_no,
        check_date = :check_date,
        check_amount = :check_amount,
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where recode = :recode";


        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $header = (object)$header; 
        
        $stmt->bindParam(":redate", $header->redate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":ivcode", $header->ivcode, PDO::PARAM_STR);
        $stmt->bindParam(":payment_type", $header->payment_type, PDO::PARAM_STR);
        $stmt->bindParam(":price", $header->price, PDO::PARAM_STR);
        $stmt->bindParam(":bank", $header->bank, PDO::PARAM_STR);
        $stmt->bindParam(":thai_name", $header->thai_name, PDO::PARAM_STR);
        $stmt->bindParam(":branch", $header->branch, PDO::PARAM_STR);
        $stmt->bindParam(":check_no", $header->check_no, PDO::PARAM_STR);
        $stmt->bindParam(":check_date", $header->check_date, PDO::PARAM_STR);
        $stmt->bindParam(":check_amount", $header->check_amount, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR); 
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);  
        $stmt->bindParam(":recode", $header->recode, PDO::PARAM_STR); 

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
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
        $sql = "SELECT a.*,c.* ";
        $sql .= " FROM `receipt` as a left outer join customer as c on (a.cuscode=c.cuscode) ";        
        $sql .= " where a.recode = :code";

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array( "header" => $header )));
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