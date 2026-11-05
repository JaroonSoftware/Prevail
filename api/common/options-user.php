<?php 
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    // $type_code = !empty($type) ? "and i.typecode = '$type'" : "";
    try { 
        $res = null;
        
        // Prefer configured groups after the reviewed permission migration is installed.
        if ($conn->query("SHOW TABLES LIKE 'prevail_role'")->fetch()) {
            $roles = $conn->query("SELECT role_code FROM prevail_role WHERE status='Y' ORDER BY seq,role_code")->fetchAll(PDO::FETCH_COLUMN);
            http_response_code(200);
            echo json_encode(array('data' => $roles));
            exit;
        }
        $sql = "SHOW COLUMNS FROM `user` LIKE 'type'";
            // $type_code
            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC); 
            $type = $row['Type'];
            preg_match('/enum\((.*)\)$/', $type, $matches);
            $res = str_replace("'", '', explode(',', $matches[1]));
            
        http_response_code(200);
        echo json_encode(array("data"=>$res));
    } catch (mysqli_sql_exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        // Ignore
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
?>