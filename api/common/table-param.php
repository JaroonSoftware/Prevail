<?php

function param_building($conn, $sql, $parm, $alias  =  "", $def_sort = ""){
    $paging = "";
    if( !empty($parm['pagination']) ){
        $pagination = (object)$parm['pagination'];
        $sql = "select count(1) r from ($sql) a"; 
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $pagination->total = intval($count["r"]);
        $limit = intval($pagination->pageSize);
        $offet = (intval($pagination->current) - 1) * $limit;
        $paging = "limit $offet, $limit";

        $parm['pagination'] = $pagination;
    }

    $order = "";
    if( !empty($parm['order']) ){ 
        $ordering = $parm['order'];
        $field = $parm['field'];
        
        $ord = convertToOrder($ordering);
        if( !empty($field) ) $order = !empty($alias) ? "order by $alias.$field $ord" : "order by $field $ord";
    } else $order = !empty($def_sort) ?"order by $def_sort" : ""; 

    return array ( 
        "parm" => $parm,
        "query" => array( 
            "paging" => $paging,
            "order" => $order,
        )
    );
}


function convertToOrder($order) { 
    if( $order == "ascend") return "asc";
    elseif( $order == "descend") return "desc";
    else return "desc"; 
}



?>