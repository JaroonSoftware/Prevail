<?php  
 
include_once(dirname(__FILE__,2)."\onload.php");

$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "POST"){
    extract($_POST, EXTR_OVERWRITE, "_");  
    try { 
 
        $sql = "
        select 
        b.*,
        i.stname,
        i.stnamedisplay,
        concat(u.firstname, ' ', u.lastname) as update_by,
        concat(c.firstname, ' ', c.lastname) as create_by
        from boms b
        left join  items i on b.prcode = i.stcode 
        left join `user` u on b.update_by = u.code
        left join `user` c on b.create_by = c.code
        where 1 = 1 and  b.status = 'Y';";
        $stmt = $conn->prepare($sql); 
        if ($stmt->execute()) {
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(array("data"=>$res));            
        }else throw new Exception("Sql error."); 

    } catch (mysqli_sql_exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        // Ignore
    }    
} 
else if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_");  
    try { 
        
        $sql = "select b.* from boms b where id = $id;";
        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $res_bom = $stmt->fetch(PDO::FETCH_ASSOC); 

        $sql = "select 
        bd.*,
        i.unit,
        i.stnamedisplay as stname
        from boms_detail bd
        left join items i on bd.stcode = i.stcode 
        where bd.bomid = $id;";
        $stmt = $conn->prepare($sql); 
        $stmt->execute();
        $res_detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data"=>array( "bom" => $res_bom, "detail" => $res_detail) ));
    } catch (mysqli_sql_exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) { 
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally{
        // Ingnore
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
?>