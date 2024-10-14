<?php 
ob_start();
include_once(dirname(__FILE__, 2)."/onload.php");
$db = new DbConnect;
$conn = $db->connect(); 

if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    $type_code = !empty($type) ? "and  lower(t.typename) = lower('$type')" : "";
    try { 
        $p = $p ?? "";
        $res = null;
        if($p == 'items'){
            $sql = "
			select i.*, UUID() `key`, t.typename
            from items i
            left outer join `itemtype` t on i.typecode = t.typecode
            where 1 = 1 and i.active_status = 'Y'
            $type_code";

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC); 
        } else if($p == 'po'){
            $sql = "
			select i.stcode,i.stname, i.buyprice, i.unit,i.vat, UUID() `key`, t.typename
            from supplier_items as s
            inner join items i on (s.stcode=i.stcode)
            left outer join `itemtype` t on i.typecode = t.typecode
            where s.supcode= '$supcode' 
            $type_code";

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC); 
        } else if ($p === 'gr' ){
            $sql = "
			SELECT a.code,a.pocode, a.stcode,i.stname, a.qty, a.price, a.unit, a.discount, a.recamount
            FROM podetail a 
            inner join pomaster b on (a.pocode=b.pocode)
            inner join items i on (a.stcode=i.stcode)
            where b.supcode= '$supcode' and b.active_status = 'Y' and b.doc_status != 'รับของครบแล้ว' "; 
            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);             
        }else if ($p === 'sup' ){
            $sql = "
			select i.stcode,i.stname, i.buyprice as price, i.unit,i.vat, UUID() `key`, t.typename
            from items i
            left outer join `itemtype` t on i.typecode = t.typecode
            where 1 = 1 and i.active_status = 'Y'
            $type_code";

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);         
        }else if ($p === 'cl' ){
            $sql = "
			select i.stcode,i.stname, d.price, i.unit,i.vat, UUID() `key`, t.typename
            from catalog_link as a
            inner join catalog_detail d on (a.catalog_code=d.catalog_code)
            inner join items i on (d.stcode=i.stcode)
            left outer join `itemtype` t on i.typecode = t.typecode
            where a.cuscode= '$cuscode'
            $type_code";

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);         
        } else  if ($p === 'items-type' ){
            $sql = "
			select t.*
            from `itemtype` t
            where 1 = 1 and t.active_status = 'Y'"; 
            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);             
        } else if ($p === 'dn') {
            $sql = "
			SELECT b.code,d.dncode,d.socode,d.dndate,i.stcode,i.stname,s.price,s.unit,count(b.code) qty,i.vat,s.discount,c.cuscode, c.cusname,c.prename, c.idno, c.road, c.subdistrict, c.district, c.province, c.zipcode,d.doc_status
            FROM dnmaster as d 
            inner join `dndetail` as b on (d.dncode=b.dncode)
            inner join `sodetail` as s on (d.socode=s.socode and s.stcode=b.stcode)
            inner join `items` as i on (b.stcode=i.stcode)
            inner join `customer` as c on (d.cuscode=c.cuscode) 
            where d.cuscode= '$cuscode' and d.doc_status = 'รอออกใบแจ้งหนี้' and b.doc_status = 'รอออกใบแจ้งหนี้'
            group by b.dncode,b.stcode
            order by b.dncode,b.stcode";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $sql = "
            select  i.stcode value, i.stname label 
            from items i
            where 1 = 1 and i.active_status = 'Y'
            $type_code"; 

            $stmt = $conn->prepare($sql); 
            $stmt->execute();
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC); 
        }

        http_response_code(200);
        echo json_encode(array("data"=>$res));
        // echo json_encode(array("data"=>$res,"sql"=>$sql));
        
        
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
ob_end_flush(); 
exit;
?>