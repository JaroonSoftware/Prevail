<?php 
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);
    
    extract($_POST, EXTR_OVERWRITE, "_");  
    
    $conn->beginTransaction();
    try { 
        $bomid = $id ?? null;
        // var_dump($bom_detail, $bomsDetail, $token->userid);
        // exit;
        $res = null;
        $action_date = date("Y-m-d H:i:s");
        $action_by = $token->userid;

        if( $action == "create" ){
            $sql = "insert into boms (bom_name,status,prcode,create_date,update_date,create_by,update_by) values (?,?,?,?,?,?,?)";
            $boms["create_date"] = $action_date;
            $boms["update_date"] = $action_date;
            
            $boms["create_by"] = $action_by;
            $boms["update_by"] = $action_by;
            extract($boms, EXTR_OVERWRITE, "_bom");
            $stmt = $conn->prepare($sql);
            if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

            $stmt->bindParam(1, $bom_name, PDO::PARAM_STR);
            $stmt->bindValue(2, $status, PDO::PARAM_STR);
            $stmt->bindValue(3, $prcode, PDO::PARAM_STR);
            $stmt->bindValue(4, $create_date, PDO::PARAM_STR);
            $stmt->bindValue(5, $update_date, PDO::PARAM_STR);
            $stmt->bindValue(6, $create_by, PDO::PARAM_INT);
            $stmt->bindValue(7, $update_by, PDO::PARAM_INT);

            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $bomid = $conn->lastInsertId();
            if( empty($bomid) ){
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
        }
        if( $action == "delete" ){
            $sql = "delete from boms where id = :id";
            $stmt = $conn->prepare($sql); 
            if (!$stmt->execute([ 'id' => $bomid ])){
                $error = $conn->errorInfo();
                throw new PDOException("Remove boms data error => $error");
            }
            
            $sql = "delete from boms_detail where bomid = :id";
            $stmt = $conn->prepare($sql); 
            if (!$stmt->execute([ 'id' => $bomid ])){
                $error = $conn->errorInfo();
                throw new PDOException("Remove boms_detail data error => $error");
            }
            
        } else {
            $sql = "delete from boms_detail where bomid = :id";
            $stmt = $conn->prepare($sql); 
            if (!$stmt->execute([ 'id' => $bomid ])){
                $error = $conn->errorInfo();
                throw new PDOException("Remove data error => $error");
            }

            $bomItemArr = array();
            foreach ($bomsDetail as $key => $val) { //
                $sql = "insert into boms_detail (bomid, stcode, prcode, item_amount, remarks, create_date, create_by) values (?,?,?,?,?,?,?)";
                $stmt = $conn->prepare($sql);
                if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
    
                $stmt->bindParam(1, $bom_name, PDO::PARAM_STR);
                $stmt->bindValue(2, $val["stcode"], PDO::PARAM_STR);
                $stmt->bindValue(3, $prcode, PDO::PARAM_STR);
                $stmt->bindValue(4, (float)$val["item_amount"], PDO::PARAM_STR);
                $stmt->bindValue(5, $val["remarks"], PDO::PARAM_STR);

                $stmt->bindValue(6, $action_date, PDO::PARAM_STR); 
                $stmt->bindValue(7, $action_by, PDO::PARAM_INT);   
                
                if(!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }

                array_push($bomItemArr, $bomDetailId);
            }

            if(!count($bomsDetail) == count($bomItemArr)){
                throw new PDOException("Insert data error => $error");
            }            
        } 
  
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $bomid)));
    } catch (PDOException $e) { 
        $conn->rollback();
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        //Ignore
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
?>