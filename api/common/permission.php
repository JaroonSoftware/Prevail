<?php

function prevail_menus() { return json_decode(file_get_contents(__DIR__ . '/permission-menus.json'), true); }
function prevail_menu_keys() { return array_column(prevail_menus(), 'key'); }
function prevail_menu_actions($key) { foreach (prevail_menus() as $m) if ($m['key'] === $key) return $m['actions']; return array(); }
function prevail_ok($data) { http_response_code(200); echo json_encode($data, JSON_UNESCAPED_UNICODE); }
function prevail_fail($message, $code = 400) { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode(array('status'=>'0','message'=>$message), JSON_UNESCAPED_UNICODE); exit; }
function prevail_json_body() { $v=json_decode(file_get_contents('php://input'),true); return is_array($v)?$v:array(); }
function ensure_permission_tables($conn) {
    static $checked=false; if ($checked) return;
    foreach (array('prevail_role','prevail_role_permission') as $name) {
        if (!$conn->query("SHOW TABLES LIKE '$name'")->fetch()) {
            prevail_fail('ยังไม่ได้ติดตั้งระบบสิทธิ์ กรุณารัน SQL 2026-11-04_program_permissions.sql ก่อนใช้งาน',503);
        }
    }
    $checked=true;
}
function prevail_current_user($conn, $token) {
    $q=$conn->prepare('SELECT code,username,type,active_status FROM user WHERE code = :id');
    $q->execute(array('id'=>$token->userid ?? null)); $u=$q->fetch(PDO::FETCH_ASSOC);
    if (!$u || $u['active_status'] !== 'Y') prevail_fail('บัญชีผู้ใช้ไม่สามารถเข้าใช้งานได้',403);
    return $u;
}
function is_admin_role($conn,$role) {
    ensure_permission_tables($conn);
    $q=$conn->prepare("SELECT is_admin FROM prevail_role WHERE role_code=:r AND status='Y'");$q->execute(array('r'=>$role));
    return $q->fetchColumn()==='Y';
}
function role_permission($conn,$role) {
    ensure_permission_tables($conn);$out=array();$admin=is_admin_role($conn,$role);
    foreach(prevail_menus() as $m) $out[$m['key']]=array('view'=>$admin,'add'=>$admin,'edit'=>$admin,'delete'=>$admin);
    $q=$conn->prepare("SELECT p.* FROM prevail_role_permission p JOIN prevail_role r ON r.role_code=p.role_code AND r.status='Y' WHERE p.role_code=:r");$q->execute(array('r'=>$role));
    if (!$admin) foreach($q->fetchAll(PDO::FETCH_ASSOC) as $p) {
        if (!isset($out[$p['menu_key']]) || in_array($p['menu_key'],array('users','permission'),true)) continue;
        foreach(array('view','add','edit','delete') as $a) $out[$p['menu_key']][$a]=$p['can_view']==='Y' && $p['can_'.$a]==='Y' && in_array($a,prevail_menu_actions($p['menu_key']),true);
    }
    return $out;
}
function assert_permission($conn,$token,$key,$action='view') {
    $user=prevail_current_user($conn,$token);$permissions=role_permission($conn,$user['type']);
    if (empty($permissions[$key][$action])) prevail_fail('ไม่มีสิทธิ์เข้าใช้งานหรือดำเนินการนี้',403);
}
