<?php

require_once dirname(__DIR__) . "/common/packing.php";
/* ============================================================================
   แก้ใบขายที่ปริ้นหน้าถุงแล้ว
   - บรรทัดที่ รหัส/หน่วย/จำนวน/น้ำหนักต่อถุง เหมือนเดิม -> เก็บ barcode + สถานะปริ้นไว้ (ย้ายไปผูกบรรทัดใหม่)
   - บรรทัดที่เปลี่ยน หรือถูกลบ -> ล้าง barcode ของบรรทัดนั้น (ต้องปริ้นใหม่)
   - ถุงที่สแกนส่งของไปแล้ว -> แก้บรรทัดนั้นไม่ได้
   ============================================================================ */
function so_label_plan(PDO $conn, string $socode, array $detail): ?array {
    $st = $conn->prepare("SELECT COUNT(*) FROM package_barcode WHERE socode = :s");
    $st->execute(['s' => $socode]);
    if ((int)$st->fetchColumn() === 0) return null;

    $cols = array();
    foreach ($conn->query("SHOW COLUMNS FROM package_barcode")->fetchAll(PDO::FETCH_ASSOC) as $c) $cols[$c['Field']] = true;
    $hasLine = isset($cols['sodetail_code']);
    $used = array();
    if (isset($cols['dncode'])) $used[] = "COALESCE(dncode,'') <> ''";
    if (isset($cols['doc_status'])) $used[] = "COALESCE(doc_status,'') = 'ขายแล้ว'";
    $usedSql = $used ? '(' . implode(' OR ', $used) . ')' : '0';
    $hasStatus = (bool)$conn->query("SHOW COLUMNS FROM sodetail LIKE 'packing_status'")->fetch();

    $st = $conn->prepare("SELECT d.code, d.stcode, d.unit, d.qty, d.packing_weight, " . ($hasStatus ? "d.packing_status" : "NULL AS packing_status") . ", i.stname
                          FROM sodetail d LEFT JOIN items i ON i.stcode = d.stcode WHERE d.socode = :s ORDER BY d.code");
    $st->execute(['s' => $socode]);
    $old = array();
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) $old[(int)$r['code']] = $r;

    /* ถุงต่อบรรทัด (และถุงแบบเดิมที่ไม่ผูกบรรทัด ต่อรหัสสินค้า) */
    $bags = array(); $bagsUsed = array(); $legacy = array(); $legacyUsed = array();
    $q = $conn->prepare("SELECT " . ($hasLine ? "sodetail_code" : "NULL AS sodetail_code") . " AS line, stcode, COUNT(*) n, SUM($usedSql) u
                         FROM package_barcode WHERE socode = :s GROUP BY line, stcode");
    $q->execute(['s' => $socode]);
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) {
        if ($r['line'] === null) { $legacy[$r['stcode']] = (int)$r['n']; $legacyUsed[$r['stcode']] = (int)$r['u']; }
        else { $bags[(int)$r['line']] = (int)$r['n']; $bagsUsed[(int)$r['line']] = (int)$r['u']; }
    }

    $same = function ($a, $b) { return abs((float)$a - (float)$b) < 0.000001; };
    $keep = array();   // index บรรทัดใหม่ -> code บรรทัดเดิม
    $taken = array();
    foreach (array_values($detail) as $i => $v) {
        $v = (array)$v;
        $c = isset($v['code']) && is_numeric($v['code']) ? (int)$v['code'] : 0;
        if ($c && isset($old[$c]) && !isset($taken[$c])) {
            $o = $old[$c];
            if ($o['stcode'] === (string)$v['stcode'] && trim((string)$o['unit']) === trim((string)$v['unit'])
                && $same($o['qty'], $v['qty'] ?? 0)
                && (($o['packing_weight'] === null && ($v['packing_weight'] ?? null) === null) || $same($o['packing_weight'], $v['packing_weight'] ?? 0))) {
                $keep[$i] = $c;
            }
            $taken[$c] = true;
        }
    }

    $kept = array_flip($keep);
    $clear = array(); $clearCodes = array(); $clearLegacy = array();
    foreach ($old as $c => $o) {
        if (!isset($kept[$c]) && !empty($bags[$c])) {
            if (!empty($bagsUsed[$c])) throw new Exception("แก้ {$o['stcode']} {$o['stname']} ไม่ได้: มีถุงที่สแกนส่งของไปแล้ว");
            $clearCodes[] = $c;
            $clear[] = array('stcode' => $o['stcode'], 'stname' => $o['stname'], 'qty' => $o['qty'], 'unit' => $o['unit'], 'bags' => $bags[$c]);
        }
    }
    /* ถุงแบบเดิม: เก็บไว้เมื่อทุกบรรทัดของรหัสนั้นไม่เปลี่ยน */
    foreach ($legacy as $stc => $n) {
        $allKept = true;
        foreach ($old as $c => $o) if ($o['stcode'] === $stc && !isset($kept[$c])) $allKept = false;
        if (!$allKept) {
            if (!empty($legacyUsed[$stc])) throw new Exception("แก้ $stc ไม่ได้: มีถุงที่สแกนส่งของไปแล้ว");
            $clearLegacy[] = $stc;
            $clear[] = array('stcode' => $stc, 'stname' => '', 'qty' => null, 'unit' => '', 'bags' => $n);
        }
    }
    return array('old' => $old, 'keep' => $keep, 'clear' => $clear, 'clearCodes' => $clearCodes,
                 'clearLegacy' => $clearLegacy, 'hasLine' => $hasLine, 'hasStatus' => $hasStatus, 'newCode' => array());
}

function so_label_apply(PDO $conn, string $socode, array $plan): void {
    if ($plan['hasLine'] && $plan['clearCodes']) {
        $in = implode(',', array_map('intval', $plan['clearCodes']));
        $conn->prepare("DELETE FROM package_barcode WHERE socode = :s AND sodetail_code IN ($in)")->execute(['s' => $socode]);
    }
    foreach ($plan['clearLegacy'] as $stc) {
        $conn->prepare("DELETE FROM package_barcode WHERE socode = :s AND stcode = :i" . ($plan['hasLine'] ? " AND sodetail_code IS NULL" : ""))
             ->execute(['s' => $socode, 'i' => $stc]);
    }
    /* บรรทัดที่เก็บไว้: ผูกถุงเดิมกับเลขบรรทัดใหม่ + คืนสถานะปริ้น */
    $mv = $plan['hasLine'] ? $conn->prepare("UPDATE package_barcode SET sodetail_code = :n WHERE socode = :s AND sodetail_code = :o") : null;
    $ps = $plan['hasStatus'] ? $conn->prepare("UPDATE sodetail SET packing_status = :p WHERE code = :n") : null;
    foreach ($plan['keep'] as $i => $oldCode) {
        $new = $plan['newCode'][$i] ?? null;
        if (!$new) continue;
        if ($mv) $mv->execute(['n' => $new, 's' => $socode, 'o' => $oldCode]);
        if ($ps && $plan['old'][$oldCode]['packing_status'] !== null) $ps->execute(['p' => $plan['old'][$oldCode]['packing_status'], 'n' => $new]);
    }
    if ($plan['hasStatus']) {
        $keepNew = array();
        foreach ($plan['keep'] as $i => $oc) if (!empty($plan['newCode'][$i])) $keepNew[] = (int)$plan['newCode'][$i];
        $conn->prepare("UPDATE sodetail SET packing_status = 'ยังไม่ปริ้นหน้าถุง' WHERE socode = :s"
            . ($keepNew ? " AND code NOT IN (" . implode(',', $keepNew) . ")" : ""))->execute(['s' => $socode]);
    }
    /* มีบรรทัดที่ล้างถุง หรือบรรทัดใหม่ที่ยังไม่ปริ้น -> สถานะใบยังปริ้นไม่ครบ */
    if ($plan['clear'] || count($plan['keep']) < count($plan['newCode'])) {
        $st = $conn->prepare("SELECT COUNT(*) FROM package_barcode WHERE socode = :s");
        $st->execute(['s' => $socode]);
        $conn->prepare("UPDATE somaster SET print_status = :p WHERE socode = :s")
             ->execute(['p' => (int)$st->fetchColumn() > 0 ? 'ปริ้นใบปะยังไม่ครบ' : 'รอปริ้นใบปะหน้าถุง', 's' => $socode]);
    }
}

ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$packingReady = packing_schema_ready($conn);
/* ชื่อ/รหัสสินค้าตามที่เขียนใน PO (AI) — เก็บติดบรรทัดไว้ให้ระบบจำตอนยืนยัน */
$aiSrc = (bool)$conn->query("SHOW COLUMNS FROM sodetail LIKE 'ai_raw_code'")->fetch();
$conn->beginTransaction();
http_response_code(400);
try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        lock_document_numbers($conn);
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");
        $action_datetime = date("Y-m-d H:i:s");
        $action_user = $token->userid;
        $socode = document_number($conn, 'socode', true);
        $catalogDate = catalog_date($header['deldate'] ?? null);
        $detail = !$packingReady ? $detail : packing_prepare_lines($conn, $detail, (string)$header['cuscode'], null, $catalogDate);
        $sql = " 
        insert somaster ( 
            socode, cuscode, sodate,customer_po, del_room, total_price,deldate, remark, active_status, doc_status, created_date, created_by
        ) 
        values (:socode, :cuscode, :sodate, :customer_po, :del_room, :total_price,:deldate, :remark, 'Y', 'รอออกใบส่งของ', :action_datetime,:action_user)";


        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;
        $stmt->bindParam(":socode", $socode, PDO::PARAM_STR);
        $stmt->bindParam(":sodate", $header->sodate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":customer_po", $header->customer_po, PDO::PARAM_STR);
        $stmt->bindParam(":del_room", $header->del_room, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":deldate", $header->deldate, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_datetime", $action_datetime, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $code = $conn->lastInsertId();
        // var_dump($master); exit;

        $sql = "insert into sodetail (socode,stcode,qty,price,unit,vat,total_cost" . ($packingReady ? ",packing_weight" : "") . ")
        values (:socode,:stcode,:qty,:price,:unit,:vat,0" . ($packingReady ? ",:packing_weight" : "") . ")";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $vat = trim((string)($val->vat ?? "")) === "" ? 0 : (int)$val->vat;
            $stmt->bindParam(":socode", $socode, PDO::PARAM_STR);
            if ($packingReady) $stmt->bindValue(":packing_weight", $val->packing_weight, $val->packing_weight === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindValue(":vat", $vat, PDO::PARAM_INT);
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code, "document_code" => $socode)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        $catalogDate = catalog_date($header['deldate'] ?? null);
        $detail = !$packingReady ? $detail : packing_prepare_lines($conn, $detail, (string)$header["cuscode"], (string)$header["socode"], $catalogDate);
        $action_datetime = date("Y-m-d H:i:s");
        $action_user = $token->userid;

        // var_dump($action_username, $action_datetime); exit;
        $sql = "
        update somaster 
        set
        cuscode = :cuscode,
        sodate = :sodate,
        customer_po = :customer_po,
        del_room = :del_room,
        total_price = :total_price,
        deldate = :deldate,
        remark = :remark, 
        updated_date = :action_datetime,
        updated_by = :action_user
        where socode = :socode";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;
        // $master->srstatus = "Y";

        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindValue(":sodate", $header->sodate, PDO::PARAM_STR);
        $stmt->bindValue(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindValue(":deldate", $header->deldate, PDO::PARAM_STR);
        $stmt->bindValue(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindValue(":customer_po", $header->customer_po, PDO::PARAM_STR);
        $stmt->bindValue(":del_room", $header->del_room, PDO::PARAM_STR);
        $stmt->bindParam(":action_datetime", $action_datetime, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);
        $stmt->bindParam(":socode", $header->socode, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }
        // var_dump($master); exit;

        /* ---------- ใบที่ปริ้นหน้าถุงแล้ว: วางแผนว่าบรรทัดไหนเก็บถุงไว้ บรรทัดไหนต้องล้าง ---------- */
        $labelPlan = $packingReady ? so_label_plan($conn, (string)$header->socode, $detail) : null;
        if ($labelPlan && $labelPlan['clear'] && empty($_PUT['confirm_clear_labels'])) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(array('status' => 0, 'code' => 'LABELS_WILL_CLEAR',
                'message' => 'บางรายการปริ้นหน้าถุงแล้ว การแก้ไขนี้จะล้าง barcode ของรายการนั้น',
                'data' => array('clear' => $labelPlan['clear'])), JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "delete from sodetail where socode = :socode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['socode' => $header->socode])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }

        $sql = "insert into sodetail (socode,stcode,unit,qty,price,vat,total_cost" . ($packingReady ? ",packing_weight" : "") . ($aiSrc ? ",ai_raw,ai_raw_code,ai_stcode" : "") . ")
        values (:socode,:stcode,:unit,:qty,:price,:vat,0" . ($packingReady ? ",:packing_weight" : "") . ($aiSrc ? ",:ai_raw,:ai_raw_code,:ai_stcode" : "") . ")";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $vat = trim((string)($val->vat ?? "")) === "" ? 0 : (int)$val->vat;
            $stmt->bindParam(":socode", $header->socode, PDO::PARAM_STR);
            if ($packingReady) $stmt->bindValue(":packing_weight", $val->packing_weight, $val->packing_weight === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $val->unit, PDO::PARAM_STR);
            $stmt->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt->bindValue(":vat", $vat, PDO::PARAM_INT);
            if ($aiSrc) {
                $stmt->bindValue(":ai_raw", isset($val->ai_raw) && $val->ai_raw !== '' ? mb_substr((string)$val->ai_raw, 0, 500, 'UTF-8') : null);
                $stmt->bindValue(":ai_raw_code", isset($val->ai_raw_code) && $val->ai_raw_code !== '' ? mb_substr((string)$val->ai_raw_code, 0, 100, 'UTF-8') : null);
                $stmt->bindValue(":ai_stcode", isset($val->ai_stcode) && $val->ai_stcode !== '' ? (string)$val->ai_stcode : null);
            }
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
            if ($labelPlan) $labelPlan['newCode'][$ind] = (int)$conn->lastInsertId();
        }

        if ($labelPlan) so_label_apply($conn, (string)$header->socode, $labelPlan);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
        // $code = $_DELETE["code"];
        $socode = $_GET["code"];
        $check = $conn->prepare("SELECT active_status, doc_status FROM somaster WHERE socode = :s FOR UPDATE");
        $check->execute(['s' => $socode]);
        $current = $check->fetch(PDO::FETCH_ASSOC);
        if (!$current || $current['active_status'] !== 'Y' || !in_array($current['doc_status'], ['รอยืนยันใบขายสินค้า', 'รอออกใบส่งของ'], true)) throw new PDOException('ไม่สามารถยกเลิกใบขายในสถานะปัจจุบันได้');
        /* ใบส่งของใช้เลข DN แล้ว (เดิมเลขเดียวกับใบขาย) -> หาผ่าน dndetail.socode เป็นหลัก */
        $linked = $conn->prepare("SELECT COUNT(*) FROM dnmaster m
            WHERE COALESCE(m.doc_status, '') <> 'ยกเลิก'
              AND (m.dncode = :s OR EXISTS (SELECT 1 FROM dndetail d WHERE d.dncode = m.dncode AND d.socode = :s2))");
        $linked->execute(['s' => $socode, 's2' => $socode]);
        if ((int)$linked->fetchColumn() > 0) throw new PDOException('มีใบส่งสินค้าที่ใช้งานอยู่ กรุณาตรวจเอกสารที่เกี่ยวข้องก่อนยกเลิก');


        $sql = "update somaster set active_status = 'N',doc_status = 'ยกเลิก' where socode = :socode";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['socode' => $socode])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove master data error => $error");
        }


        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status" => 1));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = "SELECT a.socode,a.sodate,a.deldate,a.customer_po,a.del_room,a.cuscode,
        CONCAT(c.prename,' ',c.cusname) as cusname,CONCAT(COALESCE(c.idno, '') ,' ', COALESCE(c.road, ''),' ', COALESCE(c.subdistrict, ''),' ', COALESCE(c.district, ''),' ', COALESCE(c.province, ''),' ',COALESCE(c.zipcode, '') ) as address
        ,c.zipcode,c.contact,c.tel,c.fax,c.taxnumber,a.total_price,a.remark,a.active_status,a.doc_status, a.print_status,a.created_date,a.updated_date,
        concat(IFNULL(u.firstname, ''), ' ', IFNULL(u.lastname, '')) as created_by,
        concat(IFNULL(u2.firstname, ''), ' ', IFNULL(u2.lastname, '')) as updated_by ";
        $sql .= " FROM `somaster` as a ";
        $sql .= " left outer join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " left join user u on a.created_by = u.code";
        $sql .= " left join user u2 on a.updated_by = u2.code";
        $sql .= " where a.socode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.code,a.socode,a.stcode, a.price, a.unit, a.qty,a.vat,i.stname," . ($aiSrc ? "a.ai_raw,a.ai_raw_code,a.ai_stcode," : "") . (packing_schema_ready($conn) ? "a.packing_weight" : "i.packing_weight") . " ";
        $sql .= " FROM `sodetail` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.socode = :code";
        /* เรียงตามลำดับที่บันทึก (= ลำดับในหน้าจอ / ลำดับใน PO ลูกค้า) ไม่ปล่อยให้ฐานข้อมูลเรียงเอง */
        $sql .= " order by a.code";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $header, "detail" => $detail)));
    }
} catch (PDOException $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally {
    $conn = null;
}
ob_end_flush();
exit;
