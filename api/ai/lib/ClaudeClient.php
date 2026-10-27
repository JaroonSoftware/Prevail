<?php
/* ============================================================================
   เรียก Claude Messages API ด้วย curl ล้วน ไม่ต้องลง SDK เพิ่ม
   https://platform.claude.com/docs/en/api/messages
   ============================================================================ */

final class ClaudeClient
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';
    private const VERSION = '2023-06-01';

    private string $apiKey;
    private int $timeout;
    private string $caBundle;
    private string $endpoint;

    public function __construct(string $apiKey, int $timeout = 90, string $caBundle = '', string $endpoint = '')
    {
        if (!function_exists('curl_init')) {
            throw new AiUserException('PHP ยังไม่ได้เปิด curl — แก้ php.ini ให้มีบรรทัด extension=curl แล้ว restart Apache');
        }
        $this->apiKey = $apiKey;
        $this->timeout = max(10, $timeout);
        $this->caBundle = $caBundle;
        $this->endpoint = $endpoint !== '' ? $endpoint : self::ENDPOINT;
    }

    /**
     * ส่งคำขอ คืน array(
     *   'body' => คำตอบเต็ม (array), 'usage' => [input_tokens, output_tokens],
     *   'ms' => เวลาที่ใช้, 'request_id' => ..., 'workspace_id' => ...
     * )
     * ลองใหม่อัตโนมัติ 1 ครั้งเมื่อ AI ไม่ว่าง (429 / 5xx / 529)
     */
    public function messages(array $payload): array
    {
        $attempt = 0;
        while (true) {
            $attempt++;
            $res = $this->send($payload);
            $retryable = in_array($res['status'], array(429, 500, 502, 503, 504, 529), true);
            if ($res['status'] === 200 || !$retryable || $attempt >= 2) break;
            sleep(3);
        }

        if ($res['status'] !== 200) {
            $msg = $res['body']['error']['message'] ?? ('HTTP ' . $res['status']);
            if ($res['status'] === 401) throw new AiUserException('API key ไม่ถูกต้องหรือถูกยกเลิกแล้ว (ตรวจ ANTHROPIC_API_KEY)');
            if ($res['status'] === 429) throw new AiUserException('เรียก AI ถี่เกินไป หรือเกินเพดานค่าใช้จ่ายของ Workspace — รอสักครู่แล้วลองใหม่');
            if ($res['status'] === 529 || $res['status'] >= 500) throw new AiUserException('AI ไม่ว่างชั่วคราว ลองใหม่อีกครั้ง');
            throw new RuntimeException('Claude API error: ' . $msg);
        }

        $body = $res['body'];
        return array(
            'body' => $body,
            'usage' => array(
                'input_tokens' => (int)($body['usage']['input_tokens'] ?? 0)
                    + (int)($body['usage']['cache_creation_input_tokens'] ?? 0)
                    + (int)($body['usage']['cache_read_input_tokens'] ?? 0),
                'output_tokens' => (int)($body['usage']['output_tokens'] ?? 0),
            ),
            'ms' => $res['ms'],
            'request_id' => $res['request_id'],
            'workspace_id' => $res['workspace_id'],
        );
    }

    /** หยิบ input ของ tool ที่บังคับให้ตอบ (ผลลัพธ์แบบมีโครงสร้าง) */
    public static function toolInput(array $body, string $toolName): array
    {
        foreach ($body['content'] ?? array() as $block) {
            if (($block['type'] ?? '') === 'tool_use' && ($block['name'] ?? '') === $toolName) {
                return is_array($block['input'] ?? null) ? $block['input'] : array();
            }
        }
        if (($body['stop_reason'] ?? '') === 'max_tokens') {
            throw new AiUserException('เอกสารยาวเกินไป AI ตอบไม่จบ ลองถ่ายทีละหน้า');
        }
        throw new RuntimeException('Claude ไม่ได้ส่งผลลัพธ์ในรูปแบบที่กำหนด');
    }

    private function send(array $payload): array
    {
        $headers = array();
        $ch = curl_init($this->endpoint);
        $opts = array(
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => array(
                'content-type: application/json',
                'x-api-key: ' . $this->apiKey,
                'anthropic-version: ' . self::VERSION,
            ),
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$headers) {
                $parts = explode(':', $line, 2);
                if (count($parts) === 2) $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
                return strlen($line);
            },
        );
        if ($this->caBundle !== '' && is_file($this->caBundle)) {
            $opts[CURLOPT_CAINFO] = $this->caBundle;
        }
        curl_setopt_array($ch, $opts);

        $t0 = microtime(true);
        $raw = curl_exec($ch);
        $ms = (int)round((microtime(true) - $t0) * 1000);
        $errno = curl_errno($ch);
        $err = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno) {
            if (stripos($err, 'SSL certificate') !== false) {
                throw new AiUserException('เชื่อมต่อ AI ไม่ได้: ใบรับรอง SSL — ตั้ง AI_CA_BUNDLE ใน api/ai/.env.ai (เช่น C:/xampp/apache/bin/curl-ca-bundle.crt)');
            }
            if ($errno === CURLE_OPERATION_TIMEDOUT) {
                throw new AiUserException('AI ใช้เวลานานเกินไป ลองใหม่อีกครั้ง หรือถ่ายรูปให้ชัดและไม่ใหญ่เกินไป');
            }
            throw new AiUserException('เชื่อมต่อ AI ไม่ได้ — ตรวจว่าเครื่องเซิร์ฟเวอร์ออกอินเทอร์เน็ตได้ (' . $err . ')');
        }

        $body = json_decode((string)$raw, true);
        return array(
            'status' => $status,
            'body' => is_array($body) ? $body : array(),
            'ms' => $ms,
            'request_id' => $headers['request-id'] ?? null,
            'workspace_id' => $headers['anthropic-workspace-id'] ?? null,
        );
    }
}
