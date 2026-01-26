<?php 
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    // $type_code = !empty($type) ? "and i.typecode = '$type'" : "";
    try { 
        $res = null;
        
        $sql = "SELECT a.cuscode, a.cusname, a.prename,b.county_name, a.idno, a.road, a.subdistrict, a.district, a.province, a.zipcode, a.tel, a.contact, a.fax, a.taxnumber 
        ,CONCAT(a.idno ,' ', a.road,' ', a.subdistrict,' ', a.district,' ', a.zipcode) as address
        FROM `customer` as a
        left outer join  county as b on a.county_code = b.county_code
        where a.active_status = 'Y'";
            // $type_code
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
        // Ignore
        
    }    
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}

exit;
?>