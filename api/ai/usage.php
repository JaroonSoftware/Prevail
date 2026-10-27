<?php
/* ============================================================================
   GET /api/ai/usage.php?month=2026-10

   สรุปการใช้ AI รายเดือน — ใช้ประกอบการวางบิลลูกค้า
   ยอดเงินในนี้คำนวณจากราคาที่ตั้งไว้ใน .env.ai เป็นค่าประมาณ
   ยอดที่ถูกเรียกเก็บจริงให้ดูที่ Claude Console ของ Workspace ลูกค้ารายนี้
   ============================================================================ */
ob_start();
include_once(dirname(__DIR__) . "/onload.php");
require_once __DIR__ . '/lib/bootstrap.php';

$db = new DbConnect;
$conn = $db->connect();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') throw new AiUserException('request method fail.');
    ai_require_tables($conn);

    $month = (string)($_GET['month'] ?? date('Y-m'));
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) throw new AiUserException('month ต้องเป็นรูปแบบ YYYY-MM');
    $start = $month . '-01 00:00:00';
    $end = date('Y-m-d H:i:s', strtotime($start . ' +1 month'));

    $st = $conn->prepare("
        SELECT feature, model, status,
               COUNT(*) AS calls,
               SUM(input_tokens) AS input_tokens,
               SUM(output_tokens) AS output_tokens,
               ROUND(SUM(cost_usd), 4) AS cost_usd
        FROM ai_usage_log
        WHERE created_date >= :a AND created_date < :b
        GROUP BY feature, model, status
        ORDER BY feature, model, status");
    $st->execute(array('a' => $start, 'b' => $end));
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    $st = $conn->prepare("
        SELECT status, COUNT(*) AS n FROM ai_docscan
        WHERE created_date >= :a AND created_date < :b GROUP BY status");
    $st->execute(array('a' => $start, 'b' => $end));
    $scans = array();
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) $scans[$r['status']] = (int)$r['n'];

    $total = 0.0;
    foreach ($rows as $r) $total += (float)$r['cost_usd'];

    ai_json(array(
        'status' => 1,
        'data' => array(
            'month' => $month,
            'scans' => $scans,
            'cost_usd' => round($total, 4),
            'breakdown' => $rows,
            'note' => 'ค่าประมาณจากราคาใน api/ai/.env.ai — ยอดจริงดูที่ Claude Console',
        ),
    ));
} catch (AiUserException $e) {
    ai_fail($e->getMessage(), 400);
} catch (Throwable $e) {
    error_log('[ai/usage] ' . $e->getMessage());
    ai_fail('ดึงสรุปการใช้งานไม่สำเร็จ: ' . $e->getMessage(), 500);
} finally {
    $conn = null;
}
ob_end_flush();
exit;
