<?php
/* ============================================================================
   นำเข้าไฟล์ราคา Excel (.xlsx) -> ร่างแคตตาล็อก ด้วย AI

   POST multipart: file (.xlsx)
     -> อ่านทุกชีต -> AI ดึง ชื่อสินค้า/หน่วย/ราคา/หมวด -> จับคู่กับทะเบียนสินค้า
     -> คืนให้หน้าเว็บตรวจ/แก้การจับคู่ แล้วหน้าเว็บส่งต่อไปหน้าสร้างแคตตาล็อกเดิม
     (ไฟล์นี้ไม่บันทึกแคตตาล็อกเอง ผู้ใช้กด Save ที่หน้าแคตตาล็อก)

   POST JSON { action: "learn", aliases: [{raw_text, stcode}], groups: [{stcode, group}] }
     -> จำชื่อในไฟล์คู่กับรหัสสินค้า (ครั้งหน้าจับคู่ให้เอง)
     -> ตั้งหมวดแคตตาล็อกให้สินค้าที่ยังไม่มีหมวด ตามหมวดในไฟล์ (ถ้าชื่อหมวดตรงกับในระบบ)
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/XlsxReader.php';
require_once __DIR__ . '/lib/CatalogReader.php';

/** คีย์ใน ai_item_alias สำหรับชื่อจากไฟล์ราคา (แยกจากชื่อในบิลผู้ขาย/PO ลูกค้า) */
const CATIMP_KEY = 'CATIMP';

$db = new DbConnect;
$conn = $db->connect();
$log = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new AiUserException('request method fail.');
    ai_require_enabled();
    ai_require_tables($conn);
    $userId = ai_user_id();
    $log = new UsageLog($conn, $userId);

    if (stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== false) {
        catimp_learn($conn, ai_read_json_body(), $userId);
        exit;
    }

    @set_time_limit(900);
    $f = $_FILES['file'] ?? null;
    if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) throw new AiUserException('อัปโหลดไฟล์ไม่สำเร็จ');
    $head = (string)file_get_contents($f['tmp_name'], false, null, 0, 4);
    if (strncmp($head, "PK", 2) !== 0) throw new AiUserException('รองรับเฉพาะไฟล์ .xlsx (ไฟล์ .xls รุ่นเก่าให้เปิดใน Excel แล้ว Save As เป็น .xlsx)');

    $sheets = XlsxReader::read($f['tmp_name']);
    if (!$sheets) throw new AiUserException('ไม่พบชีตที่มีข้อมูลในไฟล์นี้');

    /* หมวดแคตตาล็อกในระบบ (ถ้ารัน SQL แล้ว) ให้ AI ใช้ชื่อเดียวกัน */
    $groups = array();
    if ($conn->query("SHOW TABLES LIKE 'catalog_group'")->fetch()) {
        $groups = $conn->query("SELECT group_id, group_name FROM catalog_group WHERE active_status='Y' ORDER BY seq, group_id")->fetchAll(PDO::FETCH_ASSOC);
    }

    $mock = ai_flag('AI_MOCK');
    $model = (string)ai_cfg('AI_MODEL', 'claude-sonnet-5-5');
    if ($mock) {
        $doc = CatalogReader::mock($sheets);
        $log->write(array('feature' => 'catalog_import', 'model' => 'mock', 'status' => 'mock', 'usage' => array()));
    } else {
        $key = trim((string)ai_cfg('ANTHROPIC_API_KEY', ''));
        if ($key === '') throw new AiUserException('ยังไม่ได้ตั้ง ANTHROPIC_API_KEY ใน api/ai/.env.ai (หรือเปิด AI_MOCK=1 เพื่อทดสอบ)');
        /* AI อ่านไฟล์ใหญ่ใช้เวลาหลายนาที ระหว่างนั้นการเชื่อมต่อ MySQL ที่เปิดค้างไว้
           อาจถูกตัด ("MySQL server has gone away") -> ปิดก่อน แล้วค่อยต่อใหม่หลัง AI ตอบ */
        $log = null;
        $conn = null;
        $client = new ClaudeClient($key, max(300, (int)ai_cfg('AI_TIMEOUT_SEC', 90)), (string)ai_cfg('AI_CA_BUNDLE', ''), (string)ai_cfg('AI_API_URL', ''));
        $reader = new CatalogReader($client, $model);
        $doc = $reader->read($sheets, array_column($groups, 'group_name'));
        $conn = $db->connect();
        $log = new UsageLog($conn, $userId);
        $log->write(array(
            'feature' => 'catalog_import', 'model' => $model, 'status' => 'ok', 'usage' => $reader->usage,
            'price_in' => (float)ai_cfg('AI_PRICE_IN', 0), 'price_out' => (float)ai_cfg('AI_PRICE_OUT', 0),
        ));
    }
    if (!$doc['items']) throw new AiUserException('ไม่พบรายการสินค้าในไฟล์นี้');

    /* จับคู่กับทะเบียนสินค้า (ชื่อไทย ถ้าไม่มีใช้ชื่ออังกฤษ) */
    $matcher = new ItemMatcher($conn);
    $lines = array_map(function ($it) {
        return array('name' => $it['name'], 'code' => null, 'qty' => null, 'unit' => $it['unit'], 'confidence' => 'high');
    }, $doc['items']);
    $matched = ai_match_lines($conn, $matcher, $log, CATIMP_KEY, array('lines' => $lines), null, $mock);

    /* ข้อมูลสินค้าย่อสำหรับช่องเลือกในหน้าเว็บ */
    $groupOf = array();
    if ($conn->query("SHOW COLUMNS FROM items LIKE 'catalog_group_id'")->fetch()) {
        foreach ($conn->query("SELECT stcode, catalog_group_id FROM items WHERE catalog_group_id IS NOT NULL") as $r) $groupOf[$r['stcode']] = (int)$r['catalog_group_id'];
    }
    $itemList = array_map(function ($it) use ($groupOf) {
        return array('stcode' => $it['stcode'], 'stname' => $it['stname'], 'stnameEN' => $it['stnameEN'],
            'unit' => $it['unit'], 'catalog_group_id' => $groupOf[$it['stcode']] ?? null);
    }, $matcher->catalog());

    $out = array();
    foreach ($doc['items'] as $i => $it) {
        $m = $matched['lines'][$i]['match'] ?? array();
        $out[] = $it + array(
            'idx' => $i,
            'stcode' => $m['code'] ?? null,
            'level' => $m['level'] ?? 'low',
            'score' => $m['score'] ?? 0,
            'candidates' => array_column($m['candidates'] ?? array(), 'code'),
        );
    }

    ai_json(array('status' => 1, 'data' => array(
        'mock' => $mock,
        'meta' => $doc['meta'],
        'sheets' => array_column($sheets, 'name'),
        'groups' => $groups,
        'lines' => $out,
        'items' => $itemList,
    )));
} catch (AiUserException $e) {
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    error_log('[ai/catalog-import] ' . $e->getMessage());
    if ($log) $log->write(array('feature' => 'catalog_import', 'model' => (string)ai_cfg('AI_MODEL', ''), 'status' => 'error', 'error' => $e->getMessage()));
    ai_fail('อ่านไฟล์ราคาไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;

function catimp_learn(PDO $conn, array $body, ?string $user): void
{
    $conn->beginTransaction();
    $saved = 0;
    $st = $conn->prepare("
        INSERT INTO ai_item_alias (supcode, raw_text, raw_norm, raw_hash, stcode, created_by)
        VALUES (:s, :t, :n, :h, :c, :u)
        ON DUPLICATE KEY UPDATE stcode = VALUES(stcode), raw_text = VALUES(raw_text), hit_count = hit_count + 1");
    foreach (($body['aliases'] ?? array()) as $a) {
        $raw = AiText::str($a['raw_text'] ?? null, 160);
        $code = AiText::str($a['stcode'] ?? null, 50);
        $norm = AiText::norm($raw);
        if ($raw === null || $code === null || $norm === '') continue;
        $st->execute(array('s' => CATIMP_KEY, 't' => $raw, 'n' => mb_substr($norm, 0, 160, 'UTF-8'), 'h' => sha1($norm), 'c' => $code, 'u' => $user));
        $saved++;
    }

    $grouped = 0;
    if ($conn->query("SHOW COLUMNS FROM items LIKE 'catalog_group_id'")->fetch()) {
        $st = $conn->prepare("
            UPDATE items i JOIN catalog_group g ON g.group_name = :g
            SET i.catalog_group_id = g.group_id
            WHERE i.stcode = :s AND i.catalog_group_id IS NULL");
        foreach (($body['groups'] ?? array()) as $g) {
            $code = AiText::str($g['stcode'] ?? null, 50);
            $name = AiText::str($g['group'] ?? null, 150);
            if ($code === null || $name === null) continue;
            $st->execute(array('g' => $name, 's' => $code));
            $grouped += $st->rowCount();
        }
    }
    $conn->commit();
    ai_json(array('status' => 1, 'data' => array('aliases' => $saved, 'groups' => $grouped)));
}
