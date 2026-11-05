<?php
/**
 * สิทธิ์ของผู้ใช้ที่กำลัง login อยู่ — หน้าเว็บเรียกตอนเข้าระบบเพื่อใช้ซ่อนเมนู/ปุ่ม
 */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/permission.php");

$db = new DbConnect;
$conn = $db->connect();

try {
    ensure_permission_tables($conn);

    $currentUser = prevail_current_user($conn, $token);
    $role = $currentUser['type'];

    $stmt = $conn->prepare("select role_code, role_name, is_admin from prevail_role where role_code = :c");
    $stmt->execute(array('c' => $role));
    $roleInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    prevail_ok(array('data' => array(
        'userid'     => isset($token->userid) ? $token->userid : null,
        'firstname'  => isset($token->firstname) ? $token->firstname : null,
        'lastname'   => isset($token->lastname) ? $token->lastname : null,
        'role'       => $role,
        'role_name'  => $roleInfo ? $roleInfo['role_name'] : $role,
        'is_admin'   => is_admin_role($conn, $role),
        'permission' => role_permission($conn, $role),
        'menus'      => prevail_menus(),
    )));
} catch (Exception $e) {
    prevail_fail($e->getMessage());
} finally {
    $conn = null;
}
ob_end_flush();
exit;
