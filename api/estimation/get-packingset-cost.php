<?php
ob_start();  
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");
$db = new DbConnect;
$conn = $db->connect();
http_response_code(400);
if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_");  
    try {  
        if( empty($code) ) throw new PDOException("Parameter Empty => $error");
        $stringWithoutSpaces = preg_replace('/\s+/', '', $code);
        $array = explode(",", $stringWithoutSpaces);

        $result = array();
        foreach( $array as $i => $d){
            $sql = "
            select 
            s.id,
            s.packingsetid,
            s.pcs_carton,
            p.pkcode,
            p.pkname,
            p.pknameTH,
            p.expscode,
            p.expsname,
            p.price,
            p.transport,
            p.dimension,
            ifnull(p.weight_unit,0) weight_unit,
            ifnull(p.lost,0) * 100 lost,
            round( ifnull(p.price,0) + ifnull(p.transport,0) / ( 1 - ifnull(p.lost,0) ), 2) cost
            from packingset_detail s
            join pkmaster p on s.pkid = p.id
            where 1 = 1 and s.packingsetid = :code";          

            $stmt = $conn->prepare($sql); 
            if (!$stmt->execute([ 'code' => $d ])){
                $error = $conn->errorInfo(); 
                http_response_code(401);
                throw new PDOException("Geting code error => $error");
            }
            $spcost = $stmt->fetchAll(PDO::FETCH_ASSOC);            
            array_push($result, $spcost);
        }



        http_response_code(200);
        echo json_encode(array("data"=>array( "packing" => $result)));
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