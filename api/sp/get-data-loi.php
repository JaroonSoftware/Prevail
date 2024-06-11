<?php
ob_start();  
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");
$db = new DbConnect;
$conn = $db->connect();
http_response_code(400);
if ($_SERVER["REQUEST_METHOD"] == "GET"){
    extract($_GET, EXTR_OVERWRITE, "_"); 
    $type_code = !empty($type) ? "and i.typecode = '$type'" : "";
    try {  
        $sql = "select
        a.stnameEN,
        a.percent,
        case 
            when a.percent >= 0.5 then '>50%'
            when a.percent >= 0.4 then '40-50%'
            when a.percent >= 0.3 then '30-40%'
            when a.percent >= 0.2 then '20-30%'
            when a.percent >= 0.1 then '10-20%'
            when a.percent >= 0.01 then '1-10%'
            else 'less than 1%'
        end res 
        from (
            select
            i.stname,
            i.stnamedisplay stnameEN,
            i.stcode,
            sum( s.totalpercent ) percent
            from spdetail s 
            join items i on s.stcode =  i.stcode
            where s.spcode = :code and ( s.stcode <> '' and i.stcode is not null )
            group by i.stname, i.stnamedisplay, i.stcode
            order by percent desc, i.stnamedisplay asc
        ) a"; 

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $loi = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sql = "
        select
        a.*,
        b.cuscode,
        c.cusname, 
        u.firstname,
        u.lastname,
        concat(u.firstname, ' ', u.lastname) created_name,
        IFNULL(a.description, '') description, 
        concat(u2.firstname, ' ', u2.lastname) approved_name, 
        i.stname pkname
        FROM spmaster a
        left join srmaster b on a.srcode =  b.srcode
        left join customer c on b.cuscode = c.cuscode 
        left join user u on a.created_by  = u.code
        left join user u2 on a.approved_by = u2.code
        left join items i on a.pkcode  = i.stcode
        where a.spcode = :code"; 

        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "
        select 
            group_concat( allergen SEPARATOR ',' ) allergen
        from (
            select distinct
                replace( replace( replace( replace( replace( trim(i.allergen), ', ', ',' ), ') ', ')'), ' (', '('), '- ', '-'), ' -', '-')  allergen
            from spdetail s 
            join items i on s.stcode = i.stcode
            where not ( i.allergen is null or i.allergen in('', '-') )
            and s.spcode = :code
        ) sub"; 
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(401);
            throw new PDOException("Geting code error => $error");
        }
        // $sql = "
        // select 
        //     group_concat( allergen_new SEPARATOR ',' ) allergen
        // from (
        //     select distinct
        //     replace( replace( replace( replace( replace( trim(i.allergen), ', ', ',' ), ') ', ')'), ' (', '('), '- ', '-'), ' -', '-') allergen_new 
        //     from items i
        //     where not ( i.allergen is null or i.allergen in('', '-') )
        // ) sub"; 
        // $stmt = $conn->prepare($sql); 
        // if (!$stmt->execute()){
        //     $error = $conn->errorInfo(); 
        //     http_response_code(401);
        //     throw new PDOException("Geting code error => $error");
        // }
        $allergen = $stmt->fetch(PDO::FETCH_ASSOC); 

        http_response_code(200);
        echo json_encode(array("data"=>array( "header" => $header, "loi" => $loi, "allergen" => $allergen,)));
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