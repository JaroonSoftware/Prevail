<?php  
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php"); 
$db = new DbConnect;
$conn = $db->connect();
http_response_code(400);
if ($_SERVER["REQUEST_METHOD"] == "DELETE"){
    try {
        $id = $_GET["id"];
        $sql = "select * from attachments_control where file_uuid = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $id ])){
            $error = $conn->errorInfo(); 
            http_response_code(400);
            throw new PDOException("File not found => $error");
        } 
        $file = (object)($stmt->fetch(PDO::FETCH_ASSOC));

        $sql = "delete from attachments_control where file_uuid = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $id ])){
            $error = $conn->errorInfo(); 
            http_response_code(400);
            throw new PDOException("File not found => $error");
        }

        
        if (file_exists($file->file_path)) {
            // Attempt to delete the file
            if (unlink($file->file_path));
        }
        // else {
        //     throw new Exception( "File does not exist." );
        // } 
        http_response_code(200);
        echo json_encode(array('status' => '1', 'data' => $file));
    } catch (PDOException $e) { 
        // throw new Exception( "Error inserting rows: " . $e->getMessage() . "\n" );
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } catch (Exception $e) { 
        // throw new Exception( "Unable to delete the file: " . $e->getMessage() . "\n" );
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
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