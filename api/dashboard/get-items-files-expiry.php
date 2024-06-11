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
        
        $sql_main = "
        select 
        df.*,
        concat(
            floor(df.diff_days / 365), ' years ',
            floor((df.diff_days % 365) / 30), ' months ',
            df.diff_days % 30, ' days'
        ) as diff_formatted
        from 
        (
            select 
            ac.id,
            ac.refcode itemcode,
            ac.title_name,
            ac.expire_date,
            ac.description,
            DATEDIFF(ac.expire_date, current_date) AS diff_days,
            i.stname,
            i.stnameEN
            from attachments_control ac
            left join items i on  ac.refcode = i.stcode
            where lower( ref ) in ('items', 'packaging')
        ) df
        where 1 = 1 and df.diff_days <= 10
        ";


        $sql = "select count(1) r from ( $sql_main ) a"; 
        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);  

        $limit = intval($pagination->pageSize);
        $offet = (intval($pagination->current) - 1) * $limit;

        $sql = "$sql_main order by df.diff_days, df.id limit :offset, :limit";

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