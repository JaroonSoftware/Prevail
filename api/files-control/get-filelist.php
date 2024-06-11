<?php  
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php"); 
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    try {
        $id = $_GET["id"];
        $sql = "select * from attachments_control where file_uuid = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $id ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("File not found => $error");
        }

        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode(array('status' => '1', 'data' => $res));
    } catch (PDOException $e) { 
        throw new Exception( "Error inserting rows: " . $e->getMessage() . "\n" );
    } finally {
        $conn = null;
    }
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}
ob_end_flush(); 
exit;
?>