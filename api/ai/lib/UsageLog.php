<?php
/* ============================================================================
   บันทึกการเรียก AI ลง ai_usage_log — ใช้ทำบิลรายเดือนและตรวจย้อนหลัง
   ถ้าบันทึกไม่สำเร็จ จะไม่ทำให้งานหลักล้ม
   ============================================================================ */

final class UsageLog
{
    private PDO $conn;
    private ?string $userId;

    public function __construct(PDO $conn, ?string $userId)
    {
        $this->conn = $conn;
        $this->userId = $userId;
    }

    /**
     * $e = array(
     *   feature, model, status (ok|error|mock),
     *   usage => [input_tokens, output_tokens, ms?, request_id?, workspace_id?],
     *   price_in, price_out (USD ต่อ 1M token), error, scan_id
     * )
     * คืนค่าใช้จ่ายโดยประมาณ (USD)
     */
    public function write(array $e): float
    {
        $u = $e['usage'] ?? array();
        $in = (int)($u['input_tokens'] ?? 0);
        $out = (int)($u['output_tokens'] ?? 0);
        $cost = ($in * (float)($e['price_in'] ?? 0) + $out * (float)($e['price_out'] ?? 0)) / 1000000;

        try {
            $st = $this->conn->prepare("
                INSERT INTO ai_usage_log
                  (created_by, feature, model, input_tokens, output_tokens, cost_usd, duration_ms,
                   status, error_message, request_id, workspace_id, scan_id)
                VALUES
                  (:u, :f, :m, :i, :o, :c, :d, :s, :e, :r, :w, :scan)");
            $st->execute(array(
                'u' => $this->userId,
                'f' => (string)($e['feature'] ?? 'unknown'),
                'm' => (string)($e['model'] ?? ''),
                'i' => $in,
                'o' => $out,
                'c' => round($cost, 6),
                'd' => (int)($u['ms'] ?? 0),
                's' => (string)($e['status'] ?? 'ok'),
                'e' => isset($e['error']) ? mb_substr((string)$e['error'], 0, 150, 'UTF-8') : null,
                'r' => $u['request_id'] ?? null,
                'w' => $u['workspace_id'] ?? null,
                'scan' => $e['scan_id'] ?? null,
            ));
        } catch (Throwable $ex) {
            error_log('[ai_usage_log] ' . $ex->getMessage());
        }
        return $cost;
    }
}
