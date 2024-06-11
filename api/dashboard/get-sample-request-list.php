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
    
    try {    
        $pagination = (object)$pagination;
        $sql = "select count(1) r from srmaster where srstatus  = 'pending'"; 
        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);  

        $sql = "
        select s.*, c.cusname, sd.count_srdetail
        from srmaster s 
        left join (
            select
                ss.srcode,
                count( 1 ) count_srdetail
            from srdetail ss
            group by ss.srcode
        ) sd on s.srcode = sd.srcode
        left join customer c on s.cuscode =  c.cuscode 
        where srstatus  = 'pending'
        order by s.created_date desc
        limit :offset, :limit;";

        $limit = intval($pagination->pageSize);
        $offet = (intval($pagination->current) - 1) * $limit;
        $stmt = $conn->prepare($sql); 
        $stmt->bindParam(":offset", $offet, PDO::PARAM_INT);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        } 
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);  

        $pagination->total = intval($count["r"]);
        http_response_code(200);
        echo json_encode(array("data"=> array( "source" => $res, "pagination" => $pagination) ));
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