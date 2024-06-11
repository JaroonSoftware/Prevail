<?php 
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");  
$db = new DbConnect;
$conn = $db->connect(); 
$path = dirname(__FILE__, 3); 
if (isset($_GET['id'])) {
    $uuid = $_GET['id'];
    $f = (object)gettingFile($uuid, $conn);
    $file_path = $f->file_path;
    clearstatcache();
    if (file_exists($file_path)) { 
        $mime = mime_content_type($file_path);
        $ext = pathinfo($file_path, PATHINFO_EXTENSION);
        header('Content-Description: File Transfer');
        // var_dump($ext);
        // var_dump(in_array($ext, array("xlsx", "xls")));
        if(in_array($ext, array("xlsx", "xls"))){
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . basename($full_path) . '"');            
        }else{
            header('Content-Disposition: inline; filename=' . basename($file_path));
            header("Content-Type: $mime"); 
        } 
        header('Content-Transfer-Encoding: binary');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file_path));
        ob_clean();
        flush();
        readfile($file_path);
        exit;
    } else {  
        http_response_code(404);
        die(json_encode(array('status' => '0', 'message' => 'File not found.'))); 
    }
} else {   
    die(json_encode(array('status' => '0', 'message' => 'File path is not defined.')));
}
exit;

function gettingFile($id, $pdo) {
    try {
        $sql = "select * from attachments_control where file_uuid = :id";
        $stmt = $pdo->prepare($sql); 
        if (!$stmt->execute([ 'id' => $id ])){
            $error = $pdo->errorInfo(); 
            http_response_code(404);
            throw new PDOException("File not found => $error");
        }

        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) { 
        throw new Exception( "Error inserting rows: " . $e->getMessage() . "\n" );
    }
}