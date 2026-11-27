<?php
/* ============================================================================
   /api/ai/legacy-import.php — นำเข้า "ใบขายข้อมูลเก่า" จากรายงานประวัติการขายระบบเก่า

   POST multipart: file (PDF), cuscode? -> AI อ่าน สรุปยอดรายใบ (ยังไม่บันทึกเป็นใบขาย)
   POST JSON { import_id, cuscode, doc_nos[] } -> บันทึกลง legacy_sales (ใช้วางบิลได้)
   GET ?cuscode=&status=pending|billed|all -> รายการใบขายข้อมูลเก่า
   GET ?action=cancel&id= (POST JSON {action:'cancel', id}) -> ยกเลิกใบที่ยังไม่วางบิล
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();
$importId = null;
$log = null;

try {
    ai_require_enabled();
    $userId = ai_user_id();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET' && ($_GET['action'] ?? '') === 'file') {
        /* ส่งไฟล์ PDF ต้นฉบับ ให้หน้าเว็บแสดงตัวอย่างหน้าที่อ่านไม่ชัด */
        $st = $conn->prepare("SELECT file_path, file_name FROM legacy_import WHERE import_id = :id");
        $st->execute(array('id' => (int)($_GET['import_id'] ?? 0)));
        $f = $st->fetch(PDO::FETCH_ASSOC);
        $rel = $f ? (string)$f['file_path'] : '';
        $abs = (strpos($rel, 'uploads/ai-docscan/') === 0 && strpos($rel, '..') === false) ? ai_project_root() . '/' . $rel : null;
        if (!$abs || !is_file($abs)) throw new AiUserException('ไม่พบไฟล์ต้นฉบับ');
        ob_end_clean();
        header('Content-Type: application/pdf');
        header('Content-Length: ' . filesize($abs));
        header('Content-Disposition: inline; filename="legacy.pdf"');
        readfile($abs);
        exit;
    }

    if ($method === 'GET') {
        $where = array('l.active_status = \'Y\''); $p = array();
        $cus = AiText::str($_GET['cuscode'] ?? null, 50);
        if ($cus !== null) { $where[] = 'l.cuscode = :c'; $p['c'] = $cus; }
        $s = $_GET['status'] ?? 'all';
        /* วางบิลแล้ว = อยู่ใน bl_detail ของใบวางบิลที่ไม่ยกเลิก (ยกเลิกบิล -> กลับมารอวางบิลเอง) */
        $bl = "(SELECT MAX(bd.blcode) FROM bl_detail bd INNER JOIN bl_master bm ON bm.blcode = bd.blcode
                WHERE bd.dncode = l.doc_no AND bm.cuscode = l.cuscode AND IFNULL(bd.stcode,'') = ''
                  AND bm.doc_status != 'ยกเลิก' AND bm.active_status = 'Y')";
        if ($s === 'pending') $where[] = "$bl IS NULL";
        if ($s === 'billed') $where[] = "$bl IS NOT NULL";
        $st = $conn->prepare("SELECT l.id, l.cuscode, c.cusname, l.doc_no, l.doc_date, l.line_count, l.total, $bl AS blcode, l.import_id, l.created_date
                              FROM legacy_sales l LEFT JOIN customer c ON c.cuscode = l.cuscode
                              WHERE " . implode(' AND ', $where) . " ORDER BY l.doc_date DESC, l.doc_no DESC LIMIT 5000");
        $st->execute($p);
        ai_json(array('status' => 1, 'data' => $st->fetchAll(PDO::FETCH_ASSOC)));
        exit;
    }
    if ($method !== 'POST') throw new AiUserException('request method fail.');

    $isJson = stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== false;

    if ($isJson) {
        $body = ai_read_json_body();

        if (($body['action'] ?? '') === 'update') {
            /* แก้ยอดใบที่บันทึกแล้ว (ได้เฉพาะใบที่ยังไม่วางบิล) */
            $total = AiText::number($body['total'] ?? null);
            if ($total === null || $total < 0) throw new AiUserException('ยอดเงินไม่ถูกต้อง');
            $st = $conn->prepare("UPDATE legacy_sales SET total = :t WHERE id = :id AND active_status = 'Y'
                AND doc_no NOT IN (SELECT bd.dncode FROM bl_detail bd INNER JOIN bl_master bm ON bm.blcode = bd.blcode
                                   WHERE bm.doc_status != 'ยกเลิก' AND bm.active_status = 'Y' AND bd.dncode IS NOT NULL)");
            $st->execute(array('t' => round($total, 2), 'id' => (int)($body['id'] ?? 0)));
            if (!$st->rowCount()) {
                $chk = $conn->prepare("SELECT total FROM legacy_sales WHERE id = :id AND active_status = 'Y'");
                $chk->execute(array('id' => (int)($body['id'] ?? 0)));
                $cur = $chk->fetchColumn();
                if ($cur === false) throw new AiUserException('ไม่พบใบนี้');
                if (abs((float)$cur - $total) >= 0.005) throw new AiUserException('แก้ไขไม่ได้ — ใบนี้วางบิลแล้ว');
            }
            ai_json(array('status' => 1));
            exit;
        }

        if (($body['action'] ?? '') === 'cancel') {
            $st = $conn->prepare("UPDATE legacy_sales SET active_status = 'N' WHERE id = :id
                AND doc_no NOT IN (SELECT bd.dncode FROM bl_detail bd INNER JOIN bl_master bm ON bm.blcode = bd.blcode
                                   WHERE bm.doc_status != 'ยกเลิก' AND bm.active_status = 'Y' AND bd.dncode IS NOT NULL)");
            $st->execute(array('id' => (int)($body['id'] ?? 0)));
            if (!$st->rowCount()) throw new AiUserException('ยกเลิกไม่ได้ — ใบนี้วางบิลแล้ว หรือไม่พบ');
            ai_json(array('status' => 1));
            exit;
        }

        /* ---------- บันทึกใบที่เลือก ---------- */
        $importId = (int)($body['import_id'] ?? 0);
        $cuscode = AiText::str($body['cuscode'] ?? null, 50);
        $pick = array_map('strval', (array)($body['doc_nos'] ?? array()));
        $amounts = (array)($body['amounts'] ?? array()); // ยอดที่ผู้ใช้แก้ {doc_no: amount}
        if ($importId <= 0 || $cuscode === null || !$pick) throw new AiUserException('ต้องระบุ import_id, cuscode และเลือกอย่างน้อย 1 ใบ');

        $st = $conn->prepare("SELECT cuscode FROM customer WHERE cuscode = :c");
        $st->execute(array('c' => $cuscode));
        if (!$st->fetchColumn()) throw new AiUserException("ไม่พบลูกค้ารหัส $cuscode");

        $st = $conn->prepare("SELECT * FROM legacy_import WHERE import_id = :id");
        $st->execute(array('id' => $importId));
        $imp = $st->fetch(PDO::FETCH_ASSOC);
        if (!$imp) throw new AiUserException('ไม่พบไฟล์ที่อ่านไว้ กรุณาอัปโหลดใหม่');
        $doc = json_decode((string)$imp['extracted_json'], true);
        $byNo = array();
        foreach ((array)($doc['docs'] ?? array()) as $d) $byNo[$d['doc_no']] = $d;

        $conn->beginTransaction();
        $ins = $conn->prepare("INSERT INTO legacy_sales (cuscode, doc_no, doc_date, line_count, total, import_id, created_by)
                               VALUES (:c, :n, :d, :l, :t, :i, :u)");
        /* เลขซ้ำก็บันทึกได้: ใบที่มีเลขนี้อยู่แล้ว (รวมที่ยกเลิก) ต่อท้าย /2, /3 … เพื่อให้วางบิลแยกใบกันได้ */
        $taken = $conn->prepare("SELECT doc_no FROM legacy_sales WHERE cuscode = :c AND (doc_no = :n OR doc_no LIKE :p)");
        $saved = 0; $renamed = array();
        foreach ($pick as $no) {
            if (!isset($byNo[$no])) continue;
            $d = $byNo[$no];
            $taken->execute(array('c' => $cuscode, 'n' => $no, 'p' => $no . '/%'));
            $used = array_flip($taken->fetchAll(PDO::FETCH_COLUMN));
            $docNo = $no;
            for ($k = 2; isset($used[$docNo]); $k++) $docNo = $no . '/' . $k;
            $ins->execute(array('c' => $cuscode, 'n' => $docNo, 'd' => $d['date'] ?: null, 'l' => (int)$d['lines'],
                                't' => round((float)(isset($amounts[$no]) && is_numeric($amounts[$no]) ? $amounts[$no] : $d['amount']), 2), 'i' => $importId, 'u' => $userId));
            $saved++;
            if ($docNo !== $no) $renamed[] = $docNo;
        }
        $st = $conn->prepare("UPDATE legacy_import SET status = 'done', cuscode = :c WHERE import_id = :id");
        $st->execute(array('c' => $cuscode, 'id' => $importId));
        $conn->commit();
        ai_json(array('status' => 1, 'data' => array('saved' => $saved, 'skipped' => array(), 'renamed' => $renamed)));
        exit;
    }

    /* ---------- อัปโหลด PDF ให้ AI อ่าน ---------- */
    @set_time_limit(900);
    $log = new UsageLog($conn, $userId);
    $mock = ai_flag('AI_MOCK');
    $model = (string)ai_cfg('AI_MODEL', 'claude-sonnet-5-5');
    $cuscode = AiText::str($_POST['cuscode'] ?? null, 50);

    if (empty($_FILES['file']) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        throw new AiUserException('ไฟล์ใหญ่เกินที่เซิร์ฟเวอร์รับได้ (post_max_size ใน php.ini)');
    }
    $f = $_FILES['file'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) throw new AiUserException('อัปโหลดไฟล์ไม่สำเร็จ');
    $maxBytes = (float)ai_cfg('AI_MAX_UPLOAD_MB', 10) * 1024 * 1024;
    if ($f['size'] > $maxBytes) throw new AiUserException('ไฟล์ใหญ่เกิน ' . ai_cfg('AI_MAX_UPLOAD_MB', 10) . ' MB');
    if (ai_detect_mime($f['tmp_name']) !== 'application/pdf') throw new AiUserException('รองรับเฉพาะไฟล์ PDF รายงานประวัติการขาย');

    $stored = ai_store_upload($f['tmp_name'], 'application/pdf');
    $fileName = mb_substr((string)($f['name'] ?? ''), 0, 255, 'UTF-8');
    $st = $conn->prepare("INSERT INTO legacy_import (file_name, file_path, cuscode, status, created_by) VALUES (:n, :p, :c, 'processing', :u)");
    $st->execute(array('n' => $fileName, 'p' => $stored['rel'], 'c' => $cuscode, 'u' => $userId));
    $importId = (int)$conn->lastInsertId();

    if ($mock) {
        $doc = array('customer_code' => $cuscode ?: 'BOOI', 'period' => 'mock', 'report_total' => 1500.5, 'pages' => 1, 'docs' => array(
            array('doc_no' => 'IV0000001', 'date' => date('Y-m-d'), 'lines' => 2, 'amount' => 1000.0, 'unclear' => 0),
            array('doc_no' => 'IV0000002', 'date' => date('Y-m-d'), 'lines' => 1, 'amount' => 500.5, 'unclear' => 0),
        ));
        $log->write(array('feature' => 'legacy_read', 'model' => 'mock', 'status' => 'mock', 'usage' => array()));
    } else {
        $log = null;
        $conn = null; // ปิดระหว่างรอ AI (กัน MySQL server has gone away)
        $key = trim((string)ai_cfg('ANTHROPIC_API_KEY', ''));
        if ($key === '') throw new AiUserException('ยังไม่ได้ตั้ง ANTHROPIC_API_KEY ใน api/ai/.env.ai');
        $client = new ClaudeClient($key, max(300, (int)ai_cfg('AI_TIMEOUT_SEC', 90)), (string)ai_cfg('AI_CA_BUNDLE', ''), (string)ai_cfg('AI_API_URL', ''));
        $res = (new LegacyReportReader($client, $model))->read($stored['abs']);
        $conn = $db->connect();
        $log = new UsageLog($conn, $userId);
        $doc = $res['document'];
        $log->write(array(
            'feature' => 'legacy_read', 'model' => $model, 'status' => 'ok',
            'usage' => $res['usage'] + array('ms' => $res['ms'], 'request_id' => $res['request_id']),
            'price_in' => (float)ai_cfg('AI_PRICE_IN', 0), 'price_out' => (float)ai_cfg('AI_PRICE_OUT', 0),
        ));
    }

    $aiTotal = round(array_sum(array_column($doc['docs'], 'amount')), 2);
    $cus = $cuscode ?: ($doc['customer_code'] ?? null);
    $st = $conn->prepare("UPDATE legacy_import SET status = 'read', cuscode = :c, period_text = :pt, report_total = :rt, ai_total = :at,
                          pages = :pg, extracted_json = :j WHERE import_id = :id");
    $st->execute(array('c' => $cus, 'pt' => $doc['period'], 'rt' => $doc['report_total'], 'at' => $aiTotal,
                       'pg' => (int)$doc['pages'], 'j' => json_encode($doc, JSON_UNESCAPED_UNICODE), 'id' => $importId));

    /* ใบที่เคยนำเข้าแล้ว */
    $exist = array();
    if ($cus && $doc['docs']) {
        $st = $conn->prepare("SELECT doc_no FROM legacy_sales WHERE cuscode = :c AND active_status = 'Y'");
        $st->execute(array('c' => $cus));
        $exist = array_flip($st->fetchAll(PDO::FETCH_COLUMN));
    }
    foreach ($doc['docs'] as &$d) $d['exists'] = isset($exist[$d['doc_no']]);
    unset($d);
    $cusRow = null;
    if ($cus) {
        $st = $conn->prepare("SELECT cuscode, cusname FROM customer WHERE cuscode = :c");
        $st->execute(array('c' => $cus));
        $cusRow = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    ai_json(array('status' => 1, 'data' => array(
        'import_id' => $importId, 'mock' => $mock, 'customer' => $cusRow, 'customer_code_read' => $doc['customer_code'],
        'period' => $doc['period'], 'pages' => $doc['pages'], 'report_total' => $doc['report_total'], 'ai_total' => $aiTotal,
        'total_match' => $doc['report_total'] !== null && abs($doc['report_total'] - $aiTotal) < 0.01,
        'docs' => $doc['docs'],
    )));
} catch (AiUserException $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    legacy_failed($conn, $importId, $e->getMessage());
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    if ($conn && $conn->inTransaction()) $conn->rollBack();
    error_log('[ai/legacy-import] ' . $e->getMessage());
    legacy_failed($conn, $importId, $e->getMessage());
    if ($log) $log->write(array('feature' => 'legacy_read', 'model' => (string)ai_cfg('AI_MODEL', ''), 'status' => 'error', 'error' => $e->getMessage()));
    ai_fail('นำเข้าข้อมูลเก่าไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;

function legacy_failed(?PDO $conn, ?int $id, string $m): void
{
    if (!$conn || !$id) return;
    try {
        $conn->prepare("UPDATE legacy_import SET status = IF(status IN ('read','done'), status, 'error') WHERE import_id = :id")->execute(array('id' => $id));
    } catch (Throwable $e) {
    }
}
