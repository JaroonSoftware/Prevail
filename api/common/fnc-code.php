<?php
#region Update Code
function update_qtcode($pdo){
    $year = date("Y");
    $month = date("m");
    $sql = "update options set qtcode = qtcode + 1 where year = :y and month = :m";
    $stmt = $pdo->prepare($sql);

    if (!$stmt->execute([ 'y' => $year, 'm' => $month ])){
        $error = $pdo->errorInfo(); 
        http_response_code(401);
        throw new PDOException("Update code error => $error");
    }
} 


#endregion
 
#region Request Code
function request_supcode($pdo){ 
    $sql = "select max(cast(replace( supcode, 'SUPP-', '') as SIGNED )) m from supplier;";
    $stmt = $pdo->prepare($sql); 
    if (!$stmt->execute()){ 
        http_response_code(400);
        throw new PDOException("Geting code error => {$pdo->errorInfo()}");
    } 
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
 
    //SUPP-0000
    $res = $result["m"];
    $number = intval($res);
    $format = "SUPP-%04s";
    $code = sprintf($format, ( $number + 1) );
    return $code;
}

function request_qtcode($pdo){
    $year = date("Y");
    $month = date("m");

    $sql = "select qtcode code from options where year = :y and month = :m";
    $stmt = $pdo->prepare($sql); 
    if (!$stmt->execute([ 'y' => $year, 'm' => $month ])){
        $error = $pdo->errorInfo();
        http_response_code(401);
        throw new PDOException("Geting code error => $error");
    }

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (empty($result)) {
        create_options($pdo, $year, $month);
        return 0;
    } 
    //QU240100001
    $res = $result["code"];
    $y = substr( date("Y")+543, -2);
    $m = date("m");
    $number = intval($res);
    $prefix = "QT$y$m";
    while(true){
        $code = sprintf("%03s", ( $number + 1) );
        $format = $prefix.$code;
        $sql = "SELECT 1 r FROM qtmaster where qtcode = '$format'"; 
        $stmt = $pdo->prepare($sql); 
        $stmt->execute(); 
        if ($stmt->rowCount() > 0){
            $number += 1;
            update_qtcode($pdo);
            continue;
        } else break;
    } 
    return $prefix.sprintf("%03s", ( $number + 1) );   
}

#endregion

function create_options($pdo, $year, $month){
    $sql = "insert into options (year, month) values ( :y, :m)";
    $stmt = $pdo->prepare($sql); 
    if (!$stmt->execute([ 'y' => $year, 'm' => $month ])){
        $error = $pdo->errorInfo(); 
        http_response_code(401);
        throw new PDOException("Geting code error => $error");
    }
}


function update_option($pdo, $option){
    $year = date("Y");
    $month = date("m");
    $sql = "update options set $option = $option + 1 where year = :y";
    $stmt = $pdo->prepare($sql);

    if (!$stmt->execute([ 'y' => $year])) conn_error($pdo, "Update code error", true); 
}
