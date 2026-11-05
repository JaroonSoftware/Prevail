<?php
/**
 * ข้อมูลสำหรับหน้าจัดการสิทธิ์ — เมนูทั้งหมด + ตำแหน่ง + ตารางสิทธิ์
 */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/permission.php");

$db = new DbConnect;
$conn = $db->connect();

try {
    ensure_permission_tables($conn);
    assert_permission($conn, $token, 'permission', 'view');

    $stmt = $conn->query("select r.*,
            (select count(1) from `user` u where u.type = r.role_code) user_count
            from prevail_role r order by r.seq, r.role_code");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $conn->query("select * from prevail_role_permission");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* จัดเป็น { role_code: { menu_key: {view,add,edit,delete} } } */
    $matrix = array();
    foreach ($roles as $r) {
        $isAdmin = $r['is_admin'] === 'Y';
        $matrix[$r['role_code']] = array();
        foreach (prevail_menus() as $m) {
            $matrix[$r['role_code']][$m['key']] = array(
                'view' => $isAdmin, 'add' => $isAdmin, 'edit' => $isAdmin, 'delete' => $isAdmin,
            );
        }
    }
    foreach ($rows as $r) {
        if (!isset($matrix[$r['role_code']][$r['menu_key']])) continue;
        $matrix[$r['role_code']][$r['menu_key']] = array(
            'view'   => $r['can_view'] === 'Y',
            'add'    => $r['can_add'] === 'Y',
            'edit'   => $r['can_edit'] === 'Y',
            'delete' => $r['can_delete'] === 'Y',
        );
    }

    prevail_ok(array('data' => array(
        'menus'  => prevail_menus(),
        'roles'  => $roles,
        'matrix' => $matrix,
    )));
} catch (Exception $e) {
    prevail_fail($e->getMessage());
} finally {
    $conn = null;
}
ob_end_flush();
exit;
