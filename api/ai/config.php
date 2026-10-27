<?php
/* ============================================================================
   AI DocScan — โหลดค่าตั้งจาก api/ai/.env.ai
   ค่าใน environment ของเครื่อง (getenv) ทับค่าในไฟล์ได้
   ============================================================================ */

function ai_config(): array
{
    static $cfg = null;
    if ($cfg !== null) return $cfg;

    $cfg = array(
        'AI_ENABLED'         => '1',
        'AI_MOCK'            => '0',
        'ANTHROPIC_API_KEY'  => '',
        'AI_MODEL'           => 'claude-sonnet-5-5',
        'AI_MATCH_MODEL'     => 'claude-haiku-5-5',
        'AI_SEMANTIC_MATCH'  => '1',
        'AI_MAX_UPLOAD_MB'   => '10',
        'AI_TIMEOUT_SEC'     => '90',
        'AI_PRICE_IN'        => '2',
        'AI_PRICE_OUT'       => '10',
        'AI_MATCH_PRICE_IN'  => '0.10',
        'AI_MATCH_PRICE_OUT' => '0.50',
        'AI_CA_BUNDLE'       => '',
        /* เว้นว่าง = https://api.anthropic.com/v1/messages (เปลี่ยนเฉพาะกรณีผ่าน gateway/ทดสอบ) */
        'AI_API_URL'         => '',
    );

    $file = __DIR__ . '/.env.ai';
    if (is_file($file)) {
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            $pos = strpos($line, '=');
            if ($pos === false) continue;
            $key = trim(substr($line, 0, $pos));
            $val = trim(substr($line, $pos + 1));
            /* ตัดคอมเมนต์ท้ายบรรทัด และเครื่องหมายคำพูดครอบ */
            if ($val !== '' && $val[0] !== '"' && $val[0] !== "'") {
                $hash = strpos($val, ' #');
                if ($hash !== false) $val = rtrim(substr($val, 0, $hash));
            }
            $val = trim($val, "\"'");
            $cfg[$key] = $val;
        }
    }

    foreach (array_keys($cfg) as $key) {
        $env = getenv($key);
        if ($env !== false && $env !== '') $cfg[$key] = $env;
    }

    return $cfg;
}

function ai_cfg(string $key, $default = null)
{
    $cfg = ai_config();
    return array_key_exists($key, $cfg) ? $cfg[$key] : $default;
}

function ai_flag(string $key): bool
{
    return in_array(strtolower((string)ai_cfg($key, '0')), array('1', 'true', 'yes', 'on'), true);
}
