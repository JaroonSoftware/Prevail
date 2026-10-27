<?php
/* ============================================================================
   AI DocScan — ของที่ทุก endpoint ใช้ร่วมกัน
   endpoint ต้อง include onload.php (ตรวจ token + DbConnect) ก่อนไฟล์นี้
   ============================================================================ */

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/AiText.php';
require_once __DIR__ . '/ClaudeClient.php';
require_once __DIR__ . '/DocReader.php';
require_once __DIR__ . '/ItemMatcher.php';
require_once __DIR__ . '/SemanticMatcher.php';
require_once __DIR__ . '/UsageLog.php';
require_once __DIR__ . '/MockDoc.php';

/** ข้อความใน exception นี้แสดงให้ผู้ใช้เห็นได้ตรง ๆ */
class AiUserException extends RuntimeException
{
}

function ai_json($data, int $code = 200): void
{
    if (ob_get_length()) ob_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function ai_fail(string $message, int $code = 400): void
{
    ai_json(array('status' => 0, 'message' => $message), $code);
}

function ai_user_id(): ?string
{
    global $token;
    if (isset($token) && is_object($token) && isset($token->userid)) return (string)$token->userid;
    return null;
}

function ai_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '[]', true);
    return is_array($data) ? $data : array();
}

/** ตรวจว่ารันไฟล์ SQL แล้ว — ถ้ายัง บอกให้ชัดว่าต้องทำอะไร */
function ai_require_tables(PDO $conn): void
{
    foreach (array('ai_docscan', 'ai_usage_log', 'ai_item_alias', 'ai_supplier_alias') as $t) {
        try {
            $conn->query("SELECT 1 FROM `{$t}` LIMIT 1");
        } catch (PDOException $e) {
            throw new AiUserException("ยังไม่มีตาราง {$t} — กรุณาให้ผู้ดูแลรันไฟล์ api/ai/sql/ai_docscan.sql ก่อนใช้งาน");
        }
    }
}

function ai_require_enabled(): void
{
    if (!ai_flag('AI_ENABLED')) {
        throw new AiUserException('ฟีเจอร์อ่านใบส่งของด้วย AI ยังไม่ได้เปิดใช้งาน');
    }
}

/** สร้าง client ของ Claude พร้อมตรวจ key */
function ai_client(): ClaudeClient
{
    $key = trim((string)ai_cfg('ANTHROPIC_API_KEY', ''));
    if ($key === '') {
        throw new AiUserException('ยังไม่ได้ตั้ง ANTHROPIC_API_KEY ใน api/ai/.env.ai (หรือเปิด AI_MOCK=1 เพื่อทดสอบ)');
    }
    return new ClaudeClient(
        $key,
        (int)ai_cfg('AI_TIMEOUT_SEC', 90),
        (string)ai_cfg('AI_CA_BUNDLE', ''),
        (string)ai_cfg('AI_API_URL', '')
    );
}

/**
 * จับคู่รายการกับทะเบียนสินค้า + ให้ AI ช่วยกับแถวที่ไม่มั่นใจ (ถ้าเปิดไว้)
 * ใช้ทั้งตอนสแกนครั้งแรก และตอนผู้ใช้เปลี่ยนผู้ขายแล้วจับคู่ใหม่
 * $supcode เป็น null ได้ (ยังหาผู้ขายไม่เจอ) — ยังจับคู่สินค้าได้ แค่ไม่มีสินค้าของผู้ขายมาช่วยจัดอันดับ
 */
function ai_match_lines(PDO $conn, ItemMatcher $matcher, UsageLog $log, ?string $supcode, array $doc, ?int $scanId, bool $mock): array
{
    $result = $matcher->matchLines($supcode, $doc['lines'] ?? array());

    $needAi = array();
    foreach ($result['lines'] as $i => $line) {
        if (($line['match']['level'] ?? 'low') !== 'high') $needAi[] = $i;
    }

    if ($needAi && !$mock && ai_flag('AI_SEMANTIC_MATCH')) {
        $pool = $matcher->semanticPool($result, $needAi, 300);
        if (!$pool) return $result;
        $model = (string)ai_cfg('AI_MATCH_MODEL', 'claude-haiku-5-5');
        try {
            $sem = new SemanticMatcher(ai_client(), $model);
            $out = $sem->match($result['lines'], $needAi, $pool);
            $log->write(array(
                'feature' => 'po_match', 'model' => $model, 'status' => 'ok',
                'usage' => $out['usage'], 'scan_id' => $scanId,
                'price_in' => (float)ai_cfg('AI_MATCH_PRICE_IN', 0), 'price_out' => (float)ai_cfg('AI_MATCH_PRICE_OUT', 0),
            ));
            $result['lines'] = $matcher->applySemantic($result['lines'], $out['matches'], $pool);
        } catch (Throwable $e) {
            /* AI ช่วยจับคู่พลาด ไม่ใช่เรื่องใหญ่ — ใช้ผลจับคู่ของระบบไปก่อน */
            $log->write(array(
                'feature' => 'po_match', 'model' => $model, 'status' => 'error',
                'error' => $e->getMessage(), 'scan_id' => $scanId,
            ));
        }
    }

    return $result;
}

/* ------------------------------------------------------------------ ไฟล์ */

/** โฟลเดอร์โปรเจ็กต์ (api/ai/lib -> Prevail) */
function ai_project_root(): string
{
    return dirname(__DIR__, 3);
}

/** ดูชนิดไฟล์จากเนื้อไฟล์จริง ไม่เชื่อนามสกุล/ค่าที่เบราว์เซอร์ส่งมา */
function ai_detect_mime(string $path): ?string
{
    $h = (string)file_get_contents($path, false, null, 0, 16);
    if (strncmp($h, "\xFF\xD8\xFF", 3) === 0) return 'image/jpeg';
    if (strncmp($h, "\x89PNG", 4) === 0) return 'image/png';
    if (substr($h, 0, 4) === 'RIFF' && substr($h, 8, 4) === 'WEBP') return 'image/webp';
    if (strncmp($h, 'GIF8', 4) === 0) return 'image/gif';
    if (strncmp($h, '%PDF-', 5) === 0) return 'application/pdf';
    if (substr($h, 4, 4) === 'ftyp' && preg_match('/^(heic|heix|hevc|hevx|mif1|msf1)/', substr($h, 8, 4))) return 'image/heic';
    return null;
}

/** ย่อรูปที่ใหญ่เกินด้วย GD (สำรองไว้ กรณีอัปโหลดตรงไม่ผ่านหน้าเว็บที่ย่อให้แล้ว) */
function ai_shrink_image(string $path, int $maxSide = 2000): ?string
{
    if (!function_exists('imagecreatefromstring')) return null;
    $src = @imagecreatefromstring((string)file_get_contents($path));
    if (!$src) return null;
    $w = imagesx($src);
    $h = imagesy($src);
    $scale = min(1, $maxSide / max($w, $h));
    $nw = max(1, (int)round($w * $scale));
    $nh = max(1, (int)round($h * $scale));
    $dst = imagecreatetruecolor($nw, $nh);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    $out = preg_replace('/\.[a-z0-9]+$/i', '', $path) . '-s.jpg';
    $ok = imagejpeg($dst, $out, 85);
    imagedestroy($src);
    imagedestroy($dst);
    return $ok ? $out : null;
}

/** เก็บไฟล์ต้นฉบับไว้ใน uploads/ai-docscan/ปี/เดือน (เปิดผ่านเว็บไม่ได้) */
function ai_store_upload(string $tmp, string $mime): array
{
    $root = ai_project_root();
    $base = $root . '/uploads/ai-docscan';
    $sub = date('Y') . '/' . date('m');
    if (!is_dir("$base/$sub") && !mkdir("$base/$sub", 0775, true) && !is_dir("$base/$sub")) {
        throw new AiUserException('สร้างโฟลเดอร์ uploads/ai-docscan ไม่ได้ — ตรวจสิทธิ์การเขียนไฟล์ของโฟลเดอร์ uploads');
    }
    if (!is_file("$base/.htaccess")) {
        @file_put_contents("$base/.htaccess", "# รูปใบส่งของ เปิดผ่านเว็บไม่ได้\nRequire all denied\n");
    }
    $ext = array('image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif', 'application/pdf' => 'pdf')[$mime] ?? 'bin';
    $name = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    $abs = "$base/$sub/$name";
    if (!move_uploaded_file($tmp, $abs)) {
        throw new AiUserException('บันทึกไฟล์ไม่สำเร็จ — ตรวจสิทธิ์การเขียนไฟล์ของโฟลเดอร์ uploads');
    }
    return array('abs' => $abs, 'rel' => "uploads/ai-docscan/$sub/$name");
}

/* --------------------------------------------------------------- คำตอบ */

function ai_response(int $scanId, bool $mock, string $model, array $doc, array $sup, array $matched, array $usage): array
{
    return array(
        'status' => 1,
        'data' => array(
            'scan_id' => $scanId,
            'mock' => $mock,
            'model' => $mock ? 'mock' : $model,
            'document' => $doc,
            'supplier' => array(
                'matched' => $sup['supplier'],
                'score' => $sup['score'],
                'source' => $sup['source'],
                'candidates' => $sup['candidates'],
            ),
            'lines' => $matched['lines'],
            'items' => $matched['items'],
            'usage' => $usage,
        ),
    );
}
