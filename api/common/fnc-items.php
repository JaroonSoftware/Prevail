<?php 

function create_items_with_spcode($pdo, $spcode){
    $sql = "insert into items (stcode, stname, stnameEN, stnamedisplay, typecode, remarks, status, created_date, created_by, updated_date, updated_by, unit) 
            select 
                spcode,
                spname,
                spname,
                spname,
                ( select typecode from type where typename = 'Finish Goods' order by updated_date desc, created_date desc limit 1 ) typecode,
                concat( 'create with sample preparation code ', spcode ) remark,
                'Y' status,
                created_date, created_by, updated_date, updated_by, 'กรัม'
            from spmaster 
            where spcode = :code
            and not exists (select 1 from items where stcode = :code)";
    $stmt = $pdo->prepare($sql); 
    if (!$stmt->execute([ 'code' => $spcode])){
        $error = $pdo->errorInfo(); 
        http_response_code(401);
        throw new PDOException("Insert items error => $error");
    }
}

function update_price_items_after_astimate($pdo, $spdata){
    $sql = "update items set
            price = :price,
            yield = 100,
            multiply = 1,
            updated_date = CURRENT_TIMESTAMP(),
            updated_by = :updated_by
            where stcode = :spcode and price is not null";
    $stmt = $pdo->prepare($sql); 
    if (!$stmt->execute($spdata)){
        $error = $pdo->errorInfo(); 
        http_response_code(401);
        throw new PDOException("Insert items error => $error");
    }
}