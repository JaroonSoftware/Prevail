<?php
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php"); 
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect(); 

$path = dirname(__FILE__, 3);
$pathUpload = "uploads"; 
$action_date = date("Y-m-d H:i:s");
$action_by = $token->userid;

$conn->beginTransaction();
try {
    // echo http_response_code();
    // return;
    if ($_SERVER["REQUEST_METHOD"] == "POST") {  
        extract($_POST, EXTR_OVERWRITE, "_");  
        $FILE_REQUIRED = array("image/jpg", "image/png", "image/jpeg");    
        $pofile = str_replace("/", "", $ref ?? "name grroup");
        $pathDocument = $pofile . "//";


        if (!file_exists("$path/$pathUpload")) {
            mkdir("$path/$pathUpload", 0777, true);
        }

        if (!file_exists("$path/$pathUpload/$pofile")) {
            mkdir("$path/$pathUpload/$pofile", 0777, true);
        }

        if (!file_exists("$path/$pathUpload/$pofile/$refcode")) {
            mkdir("$path/$pathUpload/$pofile/$refcode", 0777, true);
        }

        $filepath = "$path/$pathUpload/$pofile/$refcode";

        $document = array(); 
        if (!empty($_FILES["files"])) {
            $fileData = json_decode($data, true); 
            $file = $_FILES["files"];  
            for ($i = 0; $i < count($file["name"]); $i++) {
                $file_temp = $file["tmp_name"][$i];
                $f = $file["name"][$i];
                $t = $file["type"][$i];
                // if( !in_array($t, $FILE_REQUIRED) ){ 
                //     throw new Exception("type $t for file attach incorrect."); 
                // }            
                $ext = pathinfo($f, PATHINFO_EXTENSION);
                // $fname = str_replace(".$ext", "", $f);
                $file_name = sprintf("$f-%02s.$ext", $i + 1);
                // $file_name = $f;
                $file_size = $file["size"][$i]; 
                // if (file_exists($filepath . $f)) continue;
                $fileData["refcode"] = $refcode;
                $fileData["ref"] = $ref;
                $fileData["file_name"] = $f;
                $fileData["file_path"] = "$filepath/$file_name"; 
                $fileData["file_size"] = $file_size; 
                $fileData["created_date"] = $action_date;
                $fileData["created_by"] = $action_by;
                $fileData["updated_date"] = $action_date;
                $fileData["updated_by"] = $action_by;
                $fileData["file_uuid"] = vsprintf('jr%s%s-%s', str_split(bin2hex(random_bytes(16)), 10));
                if (move_uploaded_file($file_temp, "$filepath/$file_name")) { 
                    if( $action == "add" )
                        insertAttachmentRows(array( (object)$fileData ), $conn);
                    //else if( $action == "edit"){
                    //    updateAttachmentRows(array( (object)$fileData ), $conn);
                    //}
                } 

                if( $action == "edit"){
                    updateAttachmentRows(array( (object)$fileData ), $conn);
                }
            }
        } else if( $action == "edit"){
            $fileData = json_decode($data, true); 
            updateAttachmentRows(array( (object)$fileData ), $conn); 
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> $fileData));
    } 
    
} catch(Exception $e){   
    $conn->rollback();
    echo json_encode(array('status' => '0', 'message' => $e->getMessage())); 
} finally {
    $conn = null;
}
ob_end_flush();
// ob_clean();
exit;
 
function insertAttachmentRows($data, $pdo) {
    try {
        $sql = "
        INSERT INTO attachments_control(
            refcode,
            ref, seq,
            file_name,
            file_path,
            file_size,
            expire_date,
            created_date,created_by,updated_date,updated_by,
            title_name,
            description,
            file_uuid
        ) select
            :refcode,
            :ref,
            ( IFNULL(max(seq), 0)+1 ),
            :file_name, :file_path, :file_size, :expire_date, :created_date, 
            :created_by, :updated_date, :updated_by, :title_name, :description,
            :file_uuid
            from attachments_control 
            where refcode = :refcode and ref = :ref
        ";
        $stmt = $pdo->prepare($sql);

        // Loop through the data and execute the INSERT statement for each object
        foreach ($data as $row) {
            // Bind parameters
            $stmt->bindParam(':refcode', $row->refcode );
            $stmt->bindParam(':ref', $row->ref ); 
            $stmt->bindParam(':file_name', $row->file_name );
            $stmt->bindParam(':file_path', $row->file_path );
            $stmt->bindParam(':file_size', $row->file_size );
            $stmt->bindParam(':expire_date', $row->expire_date );
            $stmt->bindParam(':created_date', $row->created_date );
            $stmt->bindParam(':created_by', $row->created_by );
            $stmt->bindParam(':updated_date', $row->updated_date );
            $stmt->bindParam(':updated_by', $row->updated_by );
            $stmt->bindParam(':title_name', $row->title_name );
            $stmt->bindParam(':description', $row->description ); 
            $stmt->bindParam(':file_uuid', $row->file_uuid );
            // Execute the statement
            $stmt->execute();

            //echo "Row inserted successfully.\n";
        }
    } catch (PDOException $e) {
        throw new Exception( "Error inserting rows: " . $e->getMessage() . "\n" );
    }
}
 
function updateAttachmentRows($data, $pdo) {
    try {
        $sql = "
        UPDATE attachments_control set 
            file_name = :file_name,
            file_path = :file_path,
            file_size = :file_size,
            expire_date = :expire_date,
            updated_date = :updated_date,
            updated_by = :updated_by,
            title_name = :title_name,
            description = :description
        where file_uuid = :file_uuid
        ";
        $stmt = $pdo->prepare($sql);
        // var_dump($data); exit;
        // Loop through the data and execute the INSERT statement for each object
        foreach ($data as $row) {
            // Bind parameters 
            $stmt->bindParam(':file_name', $row->file_name );
            $stmt->bindParam(':file_path', $row->file_path );
            $stmt->bindParam(':file_size', $row->file_size );
            $stmt->bindParam(':expire_date', $row->expire_date ); 
            $stmt->bindParam(':updated_date', $row->updated_date );
            $stmt->bindParam(':updated_by', $row->updated_by );
            $stmt->bindParam(':title_name', $row->title_name );
            $stmt->bindParam(':description', $row->description ); 
            $stmt->bindParam(':file_uuid', $row->file_uuid );
            // Execute the statement
            $stmt->execute(); 
            //echo "Row inserted successfully.\n";
        }
    } catch (PDOException $e) {
        throw new Exception( "Error inserting rows: " . $e->getMessage() . "\n" );
    }
}