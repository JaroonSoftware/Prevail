<?php
/**
 * บันทึกสิทธิ์ / จัดการตำแหน่ง
 *   PUT    บันทึกตารางสิทธิ์ทั้งหมด  { matrix: { role_code: { menu_key: {view,add,edit,delete} } } }
 *   POST   เพิ่มตำแหน่งใหม่          { header: { role_code, role_name, is_admin, seq } }
 *   PATCH  แก้ไขชื่อ/ลำดับ/สถานะ     { header: { role_code, role_name, is_admin, seq, status } }
 *   DELETE ลบตำแหน่ง (?code=)       — ลบได้เฉพาะตำแหน่งที่ไม่มีผู้ใช้ผูกอยู่
 */
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/permission.php");

$db = new DbConnect;
$conn = $db->connect();

try {
    ensure_permission_tables($conn);
    assert_permission($conn, $token, 'permission', 'edit');

    $method = $_SERVER["REQUEST_METHOD"];
    $conn->beginTransaction();
    $conn->query("SELECT role_code FROM prevail_role ORDER BY role_code FOR UPDATE")->fetchAll();
    $currentUser = prevail_current_user($conn, $token);

    if ($method === "PUT") {
        $p = prevail_json_body();
        $matrix = isset($p['matrix']) ? $p['matrix'] : array();
        if (empty($matrix)) throw new Exception('ไม่พบข้อมูลสิทธิ์ที่จะบันทึก');

        $validMenus = prevail_menu_keys();

        $stmt = $conn->query("select role_code, is_admin from prevail_role");
        $roles = array();
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) $roles[$r['role_code']] = $r['is_admin'];

        $sql = "insert into prevail_role_permission (role_code, menu_key, can_view, can_add, can_edit, can_delete)
                values (:role, :menu, :v, :a, :e, :d)
                on duplicate key update can_view = :v2, can_add = :a2, can_edit = :e2, can_delete = :d2";
        $ins = $conn->prepare($sql);

        foreach ($matrix as $roleCode => $menus) {
            if (!isset($roles[$roleCode])) continue;          // ตำแหน่งไม่มีอยู่จริง
            if ($roles[$roleCode] === 'Y') continue;          // ผู้ดูแลระบบมีสิทธิ์เต็มเสมอ ไม่ต้องเก็บ

            foreach ($menus as $menuKey => $acts) {
                if (!in_array($menuKey, $validMenus)) continue;

                $allow = prevail_menu_actions($menuKey);
                $v = (!empty($acts['view'])) ? 'Y' : 'N';
                $a = (in_array('add', $allow) && !empty($acts['add'])) ? 'Y' : 'N';
                $e = (in_array('edit', $allow) && !empty($acts['edit'])) ? 'Y' : 'N';
                $d = (in_array('delete', $allow) && !empty($acts['delete'])) ? 'Y' : 'N';

                /* ไม่ให้สิทธิ์ทำรายการโดยที่เข้าดูหน้าไม่ได้ */
                if ($v === 'N') { $a = 'N'; $e = 'N'; $d = 'N'; }

                $ins->execute(array(
                    'role' => $roleCode, 'menu' => $menuKey,
                    'v' => $v, 'a' => $a, 'e' => $e, 'd' => $d,
                    'v2' => $v, 'a2' => $a, 'e2' => $e, 'd2' => $d,
                ));
            }
        }

        $conn->commit();
        prevail_ok(array('status' => '1', 'message' => 'บันทึกสิทธิ์สำเร็จ'));
    } else if ($method === "POST") {
        $p = prevail_json_body();
        $h = (object)(isset($p['header']) ? $p['header'] : array());

        if (mb_strlen((string)($h->role_code ?? '')) > 80 || mb_strlen((string)($h->role_name ?? '')) > 120) throw new Exception('ชื่อกลุ่มยาวเกินกำหนด');
        if (empty($h->role_code)) throw new Exception('กรุณาระบุรหัสตำแหน่ง');

        $stmt = $conn->prepare("select count(1) c from prevail_role where role_code = :c");
        $stmt->execute(array('c' => $h->role_code));
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if ((int)$r['c'] > 0) throw new Exception('มีตำแหน่งนี้อยู่แล้ว');

        $stmt = $conn->prepare("insert into prevail_role (role_code, role_name, is_admin, seq, status)
                                values (:c, :n, :a, :s, 'Y')");
        $stmt->execute(array(
            'c' => $h->role_code,
            'n' => !empty($h->role_name) ? $h->role_name : $h->role_code,
            'a' => (isset($h->is_admin) && $h->is_admin === 'Y') ? 'Y' : 'N',
            's' => isset($h->seq) ? (int)$h->seq : 99,
        ));

        $conn->commit();
        prevail_ok(array('status' => '1', 'message' => 'เพิ่มตำแหน่งสำเร็จ'));
    } else if ($method === "PATCH") {
        $p = prevail_json_body();
        $h = (object)(isset($p['header']) ? $p['header'] : array());

        if (empty($h->role_code)) throw new Exception('ไม่พบรหัสตำแหน่ง');

        if ($h->role_code === $currentUser['type'] && (($h->is_admin ?? 'N') !== 'Y' || ($h->status ?? 'Y') !== 'Y')) throw new Exception('ไม่สามารถลดสิทธิ์หรือปิดกลุ่มผู้ดูแลที่กำลังใช้งาน');
        $stmt = $conn->prepare("update prevail_role set role_name = :n, is_admin = :a, seq = :s, status = :st
                                where role_code = :c");
        $stmt->execute(array(
            'n' => !empty($h->role_name) ? $h->role_name : $h->role_code,
            'a' => (isset($h->is_admin) && $h->is_admin === 'Y') ? 'Y' : 'N',
            's' => isset($h->seq) ? (int)$h->seq : 99,
            'st' => (isset($h->status) && $h->status === 'N') ? 'N' : 'Y',
            'c' => $h->role_code,
        ));

        $conn->commit();
        prevail_ok(array('status' => '1', 'message' => 'แก้ไขตำแหน่งสำเร็จ'));
    } else if ($method === "DELETE") {
        $code = isset($_GET['code']) ? $_GET['code'] : '';
        if ($code === $currentUser['type'] || $code === 'admin') throw new Exception('ไม่สามารถลบกลุ่มผู้ดูแลนี้');

        $stmt = $conn->prepare("select count(1) c from `user` where `type` = :c");
        $stmt->execute(array('c' => $code));
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if ((int)$r['c'] > 0) throw new Exception('ยังมีผู้ใช้อยู่ในตำแหน่งนี้ ไม่สามารถลบได้');

        $stmt = $conn->prepare("delete from prevail_role_permission where role_code = :c");
        $stmt->execute(array('c' => $code));
        $stmt = $conn->prepare("delete from prevail_role where role_code = :c");
        $stmt->execute(array('c' => $code));

        $conn->commit();
        prevail_ok(array('status' => '1', 'message' => 'ลบตำแหน่งสำเร็จ'));
    } else {
        throw new Exception('request method fail.');
    }
} catch (Exception $e) {
    if ($conn && $conn->inTransaction()) $conn->rollback();
    prevail_fail($e->getMessage());
} finally {
    $conn = null;
}
ob_end_flush();
exit;
