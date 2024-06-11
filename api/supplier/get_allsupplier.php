<?php
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
http_response_code(400);
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");  
    $supcode_cdt = !empty($supcode) ? "and e.supcode like '%$supcode%'" : "";
    $supname_cdt = !empty($supname) ? "and e.supname like '%$supname%'" : "";
    $country_cdt = !empty($country) ? "and e.country like '%$country%'" : "";
    $status_cdt = !empty($status) ? "and e.status = '$status'" : "";
    $typ_cdt = !empty($type) ? "and e.type in ($type)" : "and e.type in ('ผู้ขาย','ผู้ขายและผู้ผลิต')";

    try { 
        $sql = "
        select * FROM supplier e where 1 = 1
        $supcode_cdt
        $supname_cdt
        $country_cdt
        $status_cdt
        $typ_cdt
        order by updated_date desc;";

        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);  

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
        $conn = null;
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}
ob_end_flush(); 
exit;
?>