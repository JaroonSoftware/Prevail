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
    $bank_name = !empty($bank_name) ? "and (b.bank_name like '%$bank_name%' or b.bank_name_th like '%$bank_name%')" : "";
    $acc_no = !empty($acc_no) ? "and b.acc_no like '%$acc_no%'" : "";
    $acc_name = !empty($acc_name) ? "and b.acc_name like '%$acc_name%'" : "";
 

    try { 
        $p = $p ?? "";
        $key = $key ?? "";
        $res = null;
        $sql = "
        select 
        b.*,
        concat(u.firstname, ' ', u.lastname) updated_name
        from banks b
        left join user u on b.updated_by  = u.code
        where 1 = 1 and b.status = 'Y'
        $bank_name
        $expsname_cdt
        $acc_no
        $acc_name
        order by b.created_date desc";

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