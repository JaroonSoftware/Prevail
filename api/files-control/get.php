<?php  
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php"); 
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);
    extract($_POST, EXTR_OVERWRITE, "_");  
    try { 
        http_response_code(400); 
        $c_ref = !empty($ref) ? "and a.ref = '$ref'": ""; 
        $c_refcode = !empty($refcode) ? "and a.refcode = '$refcode'" : "";
        $c_file_name = !empty($file_name) ? "and a.file_name like '%$file_name%'" : ""; 
        $c_title_name = !empty($title_name) ? "and a.title_name like '%$title_name%'" : ""; 
        $sql = "
        select 
        *
        from attachments_control a
        where 1 = 1
        $c_ref
        $c_refcode
        $c_file_name
        $c_title_name
        ;";
        $stmt = $conn->prepare($sql); 
        if ($stmt->execute()) {
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode(array("data"=>$res));
        } else throw new Exception("Sql error.");  
    } catch (mysqli_sql_exception $e) { 
       
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
ob_end_flush(); 
exit;
?>