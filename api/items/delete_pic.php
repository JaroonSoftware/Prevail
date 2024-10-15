<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    // header("Access-Control-Allow-Origin: *");
    // header("Access-Control-Allow-Headers: *");
    // header("Access-Control-Allow-Methods: *");
    
    include '../conn.php';

    $uid = $_POST['uid'];
    $targetDir = "../../uploads/";

    $targetFile = $targetDir . $uid . '_*';

    $deletedFiles = glob($targetFile);
    $success = true;

    foreach ($deletedFiles as $file) {
        if (!unlink($file)) {
            $success = false;
            break;
        }
    }


    if ($success) {
        $strSQL = "DELETE FROM `items_img` WHERE img_id = '".$_POST["img_id"]."' ";
        $stmt = $conn->prepare($strSQL);    
        if ($stmt->execute()) {
        echo json_encode(["status" => "1", "message" => "The file has been deleted."]);
        }
    } else {
        echo json_encode(["status" => "0", "message" => "Sorry, there was an error deleting the file."]);
    }
?>