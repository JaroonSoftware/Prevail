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
        $sql = "insert supplier (
            supcode,supname,`type`,
            idno,road,subdistrict,district,province,zipcode,country,
            tel,fax,taxnumber,email,contact, remark, express_code,
            status,created_date,created_by,updated_date,updated_by
        ) values (
            :supcode, :supname, :type,
            :idno, :road, :subdistrict, :district, :province, :zipcode, :country,
            :tel, :fax, :taxnumber, :email, :contact, :remark, :express_code,
            :status, CURRENT_TIMESTAMP(), :created_by, CURRENT_TIMESTAMP(), :updated_by
        )";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
 
        $stmt->bindParam(":supcode", $supcode, PDO::PARAM_STR);
        $stmt->bindParam(":supname", $supname, PDO::PARAM_STR);
        $stmt->bindParam(":type", $type, PDO::PARAM_STR);
        $stmt->bindParam(":idno", $idno, PDO::PARAM_STR);
        $stmt->bindParam(":road", $road, PDO::PARAM_STR);
        $stmt->bindParam(":subdistrict", $subdistrict, PDO::PARAM_STR);
        $stmt->bindParam(":district", $district, PDO::PARAM_STR);
        $stmt->bindParam(":province", $province, PDO::PARAM_STR);
        $stmt->bindParam(":zipcode", $zipcode, PDO::PARAM_STR);
        $stmt->bindParam(":country", $country, PDO::PARAM_STR);
        $stmt->bindParam(":tel", $tel, PDO::PARAM_STR);
        $stmt->bindParam(":fax", $fax, PDO::PARAM_STR);
        $stmt->bindParam(":taxnumber", $taxnumber, PDO::PARAM_STR);
        $stmt->bindParam(":email", $email, PDO::PARAM_STR);
        $stmt->bindParam(":contact", $contact, PDO::PARAM_STR); 
        $stmt->bindParam(":remark", $remark, PDO::PARAM_STR); 
        $stmt->bindParam(":status", $status, PDO::PARAM_STR); 
        $stmt->bindParam(":express_code", $express_code, PDO::PARAM_STR); 
        $stmt->bindParam(":created_by", $action_username, PDO::PARAM_INT);
        $stmt->bindParam(":updated_by", $action_username, PDO::PARAM_INT);
        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error"); 
        }   
 
        $stmt = $conn->prepare("update supcode set number = number + 1"); 
        if (!$stmt->execute()){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Update code error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> "ok"));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_"); 

        // var_dump($_POST);
        $sql = "
        update supplier
        set 
        supname = :supname,
        type = :type,
        express_code = :express_code,
        idno = :idno,
        road = :road,
        subdistrict = :subdistrict,
        district = :district,
        province = :province,
        zipcode = :zipcode,
        country = :country,
        contact = :contact,
        tel = :tel,
        fax = :fax,
        taxnumber = :taxnumber,
        email = :email,
        status = :status,
        remark = :remark,
        updated_date = CURRENT_TIMESTAMP(), 
        updated_by = :updated_by
        where supcode = :supcode";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        // $master->srstatus = "Y"; 
        $stmt->bindParam(":supcode", $supcode, PDO::PARAM_STR);
        $stmt->bindParam(":supname", $supname, PDO::PARAM_STR);
        $stmt->bindParam(":type", $type, PDO::PARAM_STR);
        $stmt->bindParam(":idno", $idno, PDO::PARAM_STR);
        $stmt->bindParam(":road", $road, PDO::PARAM_STR);
        $stmt->bindParam(":subdistrict", $subdistrict, PDO::PARAM_STR);
        $stmt->bindParam(":district", $district, PDO::PARAM_STR);
        $stmt->bindParam(":province", $province, PDO::PARAM_STR);
        $stmt->bindParam(":zipcode", $zipcode, PDO::PARAM_STR);
        $stmt->bindParam(":country", $country, PDO::PARAM_STR);
        $stmt->bindParam(":tel", $tel, PDO::PARAM_STR);
        $stmt->bindParam(":fax", $fax, PDO::PARAM_STR);
        $stmt->bindParam(":taxnumber", $taxnumber, PDO::PARAM_STR);
        $stmt->bindParam(":email", $email, PDO::PARAM_STR);
        $stmt->bindParam(":contact", $contact, PDO::PARAM_STR);
        $stmt->bindParam(":status", $status, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $remark, PDO::PARAM_STR);
        $stmt->bindParam(":express_code", $express_code, PDO::PARAM_STR);
        $stmt->bindParam(":updated_by", $action_username, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 
        
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $_PUT)));

    } else if($_SERVER["REQUEST_METHOD"] == "DELETE"){ 
        // ignore
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"];
        
        $sql = "select p.* from supplier p where p.supcode = :id";
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