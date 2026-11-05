<?php
/**
 * รายชื่อผู้ใช้ในตำแหน่งหนึ่ง — ใช้ตอนกดดูจากคอลัมน์ "จำนวนผู้ใช้" ในหน้าสิทธิ์
 * GET ?code=<prevail_role.role_code>
 */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/permission.php");

$db = new DbConnect;
$conn = $db->connect();

try {
    ensure_permission_tables($conn);
    assert_permission($conn, $token, 'permission', 'view');

    $code = isset($_GET['code']) ? trim($_GET['code']) : '';
    if ($code === '') throw new Exception('กรุณาระบุรหัสตำแหน่ง');

    $stmt = $conn->prepare("select role_code, role_name from prevail_role where role_code = :c");
    $stmt->execute(array('c' => $code));
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    /* คีย์ของตาราง user คือคอลัมน์ code (ไม่ใช่ userid) */
    $stmt = $conn->prepare("select code, username, firstname, lastname, tel, email, `type`, active_status
                            from `user`
                            where `type` = :c
                            order by active_status desc, firstname, lastname");
    $stmt->execute(array('c' => $code));
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    prevail_ok(array('data' => array(
        'role'  => $role ?: array('role_code' => $code, 'role_name' => $code),
        'users' => $users,
    )));
} catch (Exception $e) {
    prevail_fail($e->getMessage());
} finally {
    $conn = null;
}
ob_end_flush();
exit;
