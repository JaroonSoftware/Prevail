<?php 
ob_start(); 
include_once(dirname(__FILE__, 2)."/onload.php");
include_once(dirname(__FILE__, 2)."/common/fnc-code.php");
include_once(dirname(__FILE__, 2)."/common/fnc-items.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);

function sql__estimation_detail(){
    $sql = "insert into estimation_detail (
        estcode,packingsetid,fill_volume,declared,margin,netweight,unit_cost,
        productcost,othercost,exworkcost_carton,exworksell_price,
        otherweight, gross_weight_carton,
        created_by, created_date
    )
    values (
        :estcode,
        :packingsetid,
        :fill_volume,
        :declared,
        :margin,
        :netweight,
        :unit_cost,
        :productcost,
        :othercost,
        :exworkcost_carton,
        :exworksell_price,
        :otherweight,
        :gross_weight_carton,
        :action_user, CURRENT_TIMESTAMP()
    )";
    return $sql;
}

function sql__estimation_lists(){
    $sql = "insert into estimation_lists (
        estcode,estdetailid,pkname,price,lost,transport,pcs_carton,cost,cost_carton,seq,packingsetid,created_by,created_date,
        weight_unit, weight_carton
    )
    values (
        :estcode,
        :estdetailid,
        :pkname,
        :price,
        :lost,
        :transport,
        :pcs_carton,
        :cost,
        :cost_carton,
        :seq,
        :packingsetid,
        :action_user, CURRENT_TIMESTAMP(),
        :weight_unit, 
        :weight_carton
    )"; 
    return $sql;
}

function sql__estimation_sample(){
    $sql = "insert into estimation_sample (
        estcode,spcode,spno,stcode,amount,percent,totalpercent,`method`,stepno,amount_total,amount_after_lost,lost,price,yield,multiply,created_by,created_date
    )
    values (
        :estcode,
        :spcode,
        :spno,
        :stcode,
        :amount,
        :percent,
        :totalpercent,
        :method,
        :stepno,
        :amount_total,
        :amount_after_lost,
        :lost,
        :price,
        :yield,
        :multiply,
        :action_user, CURRENT_TIMESTAMP()
    )"; 
    return $sql;
}

try {
    $action_date = date("Y-m-d H:i:s"); 
    $action_user = $token->userid;

    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true); 
        extract($_POST, EXTR_OVERWRITE, "_");

        $code = request_estcode($conn);

        // var_dump($_POST);
        $sql = "insert estimation (estcode,spcode,spname,specific_gravity,product_cost,remark,created_date,updated_date,created_by,updated_by) 
        values (
            :estcode,
            :spcode,
            :spname,
            :specific_gravity,
            :product_cost, 
            :remark,
            CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(),:action_user,:action_user
        )";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $head = (object)$head;
        $stmt->bindParam(":estcode", $code, PDO::PARAM_STR);
        $stmt->bindParam(":spcode", $head->spcode, PDO::PARAM_STR);
        $stmt->bindParam(":spname", $head->spname, PDO::PARAM_STR);
        $stmt->bindParam(":specific_gravity", $head->specific_gravity, PDO::PARAM_STR);
        $stmt->bindParam(":product_cost", $head->product_cost, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":remark", $head->remark, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        // var_dump($master); exit;

        $sql = sql__estimation_detail();
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $esdetail_arr = array();
        // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":estcode", $code, PDO::PARAM_STR);
            $stmt->bindParam(":packingsetid", $val->packingsetid, PDO::PARAM_INT);
            $stmt->bindParam(":fill_volume", $val->fill_volume, PDO::PARAM_STR);
            $stmt->bindParam(":declared", $val->declared, PDO::PARAM_STR);
            $stmt->bindParam(":margin", $val->margin, PDO::PARAM_STR);
            $stmt->bindParam(":netweight", $val->netweight, PDO::PARAM_STR);
            $stmt->bindParam(":unit_cost", $val->unit_cost, PDO::PARAM_INT);
            $stmt->bindParam(":productcost", $val->productcost, PDO::PARAM_STR);
            $stmt->bindParam(":othercost", $val->othercost, PDO::PARAM_STR);
            $stmt->bindParam(":exworkcost_carton", $val->exworkcost_carton, PDO::PARAM_STR);
            $stmt->bindParam(":exworksell_price", $val->exworksell_price, PDO::PARAM_STR);
            $stmt->bindParam(":gross_weight_carton", $val->gross_weight_carton, PDO::PARAM_STR);
            $stmt->bindParam(":otherweight", $val->otherweight, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT); 
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
            
            // $esdetail_arr["$val->packingsetid"] = $conn->lastInsertId();
            array_push($esdetail_arr, $conn->lastInsertId());
        }
        
        $sql = sql__estimation_lists();
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 
        foreach( $list as $i => $d) {
            foreach( $d as $ind => $val) {
                $estdetailid = $esdetail_arr[$i];
                $seq = $ind + 1;
                $val = (object)$val;
                $stmt->bindParam(":estcode", $code, PDO::PARAM_STR);
                $stmt->bindParam(":estdetailid", $estdetailid, PDO::PARAM_INT);
                $stmt->bindParam(":pkname", $val->pkname, PDO::PARAM_STR);
                $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
                $stmt->bindParam(":lost", $val->lost, PDO::PARAM_STR);
                $stmt->bindParam(":transport", $val->transport, PDO::PARAM_STR);
                $stmt->bindParam(":pcs_carton", $val->pcs_carton, PDO::PARAM_INT);
                $stmt->bindParam(":cost", $val->cost, PDO::PARAM_STR);
                $stmt->bindParam(":cost_carton", $val->cost_carton, PDO::PARAM_STR);
                $stmt->bindParam(":seq", $seq, PDO::PARAM_INT);
                $stmt->bindParam(":packingsetid", $val->packingsetid, PDO::PARAM_INT);
                $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
                $stmt->bindParam(":weight_unit", $val->weight_unit, PDO::PARAM_STR);
                $stmt->bindParam(":weight_carton", $val->weight_carton, PDO::PARAM_STR);
                if(!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error"); 
                }
            } 
        }

        $sql = sql__estimation_sample();
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");
 
        foreach( $sample as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":estcode", $code, PDO::PARAM_STR);
            $stmt->bindParam(":spcode", $val->spcode, PDO::PARAM_STR);
            $stmt->bindParam(":spno", $val->spno, PDO::PARAM_INT);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":amount", $val->amount, PDO::PARAM_STR);
            $stmt->bindParam(":percent", $val->percent, PDO::PARAM_STR);
            $stmt->bindParam(":totalpercent", $val->totalpercent, PDO::PARAM_STR);
            $stmt->bindParam(":method", $val->method, PDO::PARAM_STR);
            $stmt->bindParam(":stepno", $val->stepno, PDO::PARAM_INT);
            $stmt->bindParam(":amount_total", $val->amount_total, PDO::PARAM_STR);
            $stmt->bindParam(":amount_after_lost", $val->amount_after_lost, PDO::PARAM_STR);
            $stmt->bindParam(":lost", $val->lost, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt->bindParam(":yield", $val->yield, PDO::PARAM_STR);
            $stmt->bindParam(":multiply", $val->multiply, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            } 
        }

        update_price_items_after_astimate($conn, ["spcode"=>$head->spcode, "price"=> $head->product_cost, ":updated_by" => $action_user]);

        update_estcode($conn);
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> array("id" => $code)));

    } else  if($_SERVER["REQUEST_METHOD"] == "PUT"){
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true); 
        extract($_PUT, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        $sql = "
        update estimation 
        set
        spcode = :spcode,
        spname = :spname,
        specific_gravity = :specific_gravity,
        product_cost = :product_cost, 
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user,
        remark = :remark
        where estcode = :estcode";

        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}"); 

        $head = (object)$head;
        // $master->srstatus = "Y";
        $stmt->bindParam(":estcode", $head->estcode, PDO::PARAM_STR);
        $stmt->bindParam(":spcode", $head->spcode, PDO::PARAM_STR);
        $stmt->bindParam(":spname", $head->spname, PDO::PARAM_STR);
        $stmt->bindParam(":specific_gravity", $head->specific_gravity, PDO::PARAM_STR);
        $stmt->bindParam(":product_cost", $head->product_cost, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":remark", $head->remark, PDO::PARAM_STR);

        if(!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $sql = "delete from estimation_detail where estcode = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $head->estcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = sql__estimation_detail();
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $esdetail_arr = array();
        // $detail = $detail;  
        foreach( $detail as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":estcode", $head->estcode, PDO::PARAM_STR);
            $stmt->bindParam(":packingsetid", $val->packingsetid, PDO::PARAM_INT);
            $stmt->bindParam(":fill_volume", $val->fill_volume, PDO::PARAM_STR);
            $stmt->bindParam(":declared", $val->declared, PDO::PARAM_STR);
            $stmt->bindParam(":margin", $val->margin, PDO::PARAM_STR);
            $stmt->bindParam(":netweight", $val->netweight, PDO::PARAM_STR);
            $stmt->bindParam(":unit_cost", $val->unit_cost, PDO::PARAM_INT);
            $stmt->bindParam(":productcost", $val->productcost, PDO::PARAM_STR);
            $stmt->bindParam(":othercost", $val->othercost, PDO::PARAM_STR);
            $stmt->bindParam(":exworkcost_carton", $val->exworkcost_carton, PDO::PARAM_STR);
            $stmt->bindParam(":exworksell_price", $val->exworksell_price, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT); 
            $stmt->bindParam(":gross_weight_carton", $val->gross_weight_carton, PDO::PARAM_STR);
            $stmt->bindParam(":otherweight", $val->otherweight, PDO::PARAM_STR);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
            
            // $esdetail_arr[$val->packingsetid] = $conn->lastInsertId();
            array_push($esdetail_arr, $conn->lastInsertId());
        }
        

        $sql = "delete from estimation_lists where estcode = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $head->estcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = sql__estimation_lists();
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");
        // var_dump($esdetail_arr);
        foreach( $list as $i => $d)
            foreach( $d as $ind => $val) {
                // $esdetailid = $esdetail_arr[$val->packingsetid];
                $estdetailid = $esdetail_arr[$i];
                $seq = $ind + 1;
                $val = (object)$val;
                $stmt->bindParam(":estcode", $head->estcode, PDO::PARAM_STR);
                $stmt->bindParam(":estdetailid", $estdetailid, PDO::PARAM_INT);
                $stmt->bindParam(":pkname", $val->pkname, PDO::PARAM_STR);
                $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
                $stmt->bindParam(":lost", $val->lost, PDO::PARAM_STR);
                $stmt->bindParam(":transport", $val->transport, PDO::PARAM_STR);
                $stmt->bindParam(":pcs_carton", $val->pcs_carton, PDO::PARAM_INT);
                $stmt->bindParam(":cost", $val->cost, PDO::PARAM_STR);
                $stmt->bindParam(":cost_carton", $val->cost_carton, PDO::PARAM_STR);
                $stmt->bindParam(":weight_unit", $val->weight_unit, PDO::PARAM_STR);
                $stmt->bindParam(":weight_carton", $val->weight_carton, PDO::PARAM_STR);
                $stmt->bindParam(":seq", $seq, PDO::PARAM_INT);
                $stmt->bindParam(":packingsetid", $val->packingsetid, PDO::PARAM_INT);
                $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
                if(!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error"); 
                }
            }

        $sql = "delete from estimation_sample where estcode = :id";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute([ 'id' => $head->estcode ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
    
        $sql = sql__estimation_sample();
        $stmt = $conn->prepare($sql);
        if(!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");
 
        foreach( $sample as $ind => $val){
            $val = (object)$val;
            $stmt->bindParam(":estcode", $head->estcode, PDO::PARAM_STR);
            $stmt->bindParam(":spcode", $val->spcode, PDO::PARAM_STR);
            $stmt->bindParam(":spno", $val->spno, PDO::PARAM_INT);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":amount", $val->amount, PDO::PARAM_STR);
            $stmt->bindParam(":percent", $val->percent, PDO::PARAM_STR);
            $stmt->bindParam(":totalpercent", $val->totalpercent, PDO::PARAM_STR);
            $stmt->bindParam(":method", $val->method, PDO::PARAM_STR);
            $stmt->bindParam(":stepno", $val->stepno, PDO::PARAM_INT);
            $stmt->bindParam(":amount_total", $val->amount_total, PDO::PARAM_STR);
            $stmt->bindParam(":amount_after_lost", $val->amount_after_lost, PDO::PARAM_STR);
            $stmt->bindParam(":lost", $val->lost, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt->bindParam(":yield", $val->yield, PDO::PARAM_STR);
            $stmt->bindParam(":multiply", $val->multiply, PDO::PARAM_STR);
            $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            if(!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error"); 
            }
        }

        update_price_items_after_astimate($conn, ["spcode"=>$head->spcode, "price"=> $head->product_cost, ":updated_by" => $action_user]);
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data"=> "success") );
    } else  if($_SERVER["REQUEST_METHOD"] == "DELETE"){
        // $code = $_DELETE["code"];
        $code = $_GET["code"];
        
        $sql = "delete from estimation where estcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }            
        
        $sql = "delete from estimation_detail where estcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        
        $sql = "delete from estimation_lists where estcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        
        $sql = "delete from estimation_sample where estcode = :id";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if($_SERVER["REQUEST_METHOD"] == "GET"){
        $code = $_GET["code"]; 
        $sql = "
        select 
        e.*,
        concat(u1.firstname, ' ', u1.lastname) created_name,
        concat(u.firstname, ' ', u.lastname) updated_name,
        sr.cuscode,
        c.cusname,
        c.idno,
        c.road,
        c.subdistrict,
        c.district,
        c.province,
        c.zipcode,
        c.tel,
        s.netweight netweight_org,
        s.specific_gravity specific_gravity_org,
        s.spdate
        from estimation e
        join spmaster s on e.spcode =  s.spcode
        left join srmaster sr on s.srcode = sr.srcode
        left join customer c on sr.cuscode = c.cuscode
        left join user u on e.updated_by = u.code
        left join user u1 on e.created_by = u1.code
        where e.estcode = :id";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $head = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "
        select 
            ed.id estdetailid,
            ed.estcode,
            ed.packingsetid id,
            ed.fill_volume,
            ed.declared,
            ed.margin,
            ed.netweight,
            ed.unit_cost,
            ed.productcost,
            ed.othercost,
            ed.exworkcost_carton,
            ed.exworksell_price,
            ed.otherweight,
            ed.gross_weight_carton,
            ed.exworksell_price,
            p.id packingsetid,
            p.packingset_name,
            p.fill_volume fill_volume_org,
            p.unit_cost unit_cost_org,
            p.declared declared_org
        from estimation_detail ed 
        left join packingset p on ed.packingsetid = p.id
        where ed.estcode = :id
        order by ed.id";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $list = array();
        foreach( $detail as $ind => $val){
            $sql = "select 
            el.id,
            el.estcode,
            el.estdetailid,
            el.price,
            el.pkname,
            el.lost,
            el.transport,
            el.pcs_carton,
            el.weight_unit,
            el.weight_carton,
            el.cost,
            ifnull( el.cost_carton, el.cost * el.pcs_carton) cost_carton,
            el.seq,
            el.created_date,
            el.created_by,
            el.packingsetid
            from estimation_lists el where el.estcode = :id and estdetailid = :estdetailid order by el.estdetailid, el.seq"; 
            $stmt = $conn->prepare($sql); 
            if (!$stmt->execute([ 'id' => $code, 'estdetailid' => $val["estdetailid"] ])){
                $error = $conn->errorInfo(); 
                http_response_code(404);
                throw new PDOException("Geting data error => $error");
            }
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 

            array_push($list, $result);
        }


        $sql = "
        select 
        e.*,
        i.stname
        from estimation_sample e
        left join items i on e.stcode = i.stcode
        where e.estcode = :id";
        
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'id' => $code ])){
            $error = $conn->errorInfo(); 
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $sample = $stmt->fetchAll(PDO::FETCH_ASSOC); 

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array( "head" => $head, "detail" => $detail, "list" => $list, "sample" => $sample )));
    }

} catch (PDOException $e) { 
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) { 
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally{
    $conn = null;
}  
ob_end_flush(); 
exit;