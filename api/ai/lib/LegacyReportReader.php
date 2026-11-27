<?php
/* ============================================================================
   อ่าน "รายงานประวัติการขาย แยกตามลูกค้า" จากระบบเก่า (PDF) แล้วสรุปยอดรวมรายใบขาย
   - เลขที่เอกสารในรายงาน เช่น "IV0371320- 14" = ใบ IV0371320 บรรทัดที่ 14
     -> รวมยอด "ยอดขายสุทธิ" ของทุกบรรทัดที่เลขใบเดียวกัน
   - ข้อความใน PDF ฟอนต์ไทยเพี้ยน ดึงตรงๆ ไม่ได้ จึงให้ AI อ่านจากภาพทีละช่วงหน้า
   - แต่ละช่วงคืนแค่ยอดรวมต่อใบ (ผลลัพธ์สั้น) แล้วรวมทุกช่วงเข้าด้วยกัน
   ============================================================================ */

final class LegacyReportReader
{
    public const TOOL = 'record_invoice_totals';
    private const PAGES_PER_CALL = 6;

    private ClaudeClient $client;
    private string $model;

    public function __construct(ClaudeClient $client, string $model)
    {
        $this->client = $client;
        $this->model = $model;
    }

    /** คืน ['document' => [customer_code, period, report_total, pages, docs[]], 'usage' => รวมทุกรอบ, 'ms', 'request_id'] */
    public function read(string $path): array
    {
        $bytes = file_get_contents($path);
        if ($bytes === false) throw new RuntimeException('อ่านไฟล์ที่อัปโหลดไม่ได้');
        $fileBlock = array('type' => 'document', 'source' => array('type' => 'base64', 'media_type' => 'application/pdf', 'data' => base64_encode($bytes)),
            'cache_control' => array('type' => 'ephemeral'));
        $pages = self::pdfPageCount($bytes);

        $ranges = array();
        for ($a = 1; $a <= $pages; $a += self::PAGES_PER_CALL) $ranges[] = array($a, min($pages, $a + self::PAGES_PER_CALL - 1));

        $docs = array();
        $customer = null; $period = null; $grand = null;
        $usage = array('input_tokens' => 0, 'output_tokens' => 0);
        $ms = 0; $rid = null;
        while ($ranges) {
            $range = array_shift($ranges);
            try {
                $call = $this->callOnce($fileBlock, $range);
            } catch (AiUserException $e) {
                /* ช่วงนี้ AI ตอบไม่จบ -> แบ่งครึ่ง */
                if (strpos($e->getMessage(), 'ไม่ครบ') === false || $range[0] === $range[1]) throw $e;
                $mid = intdiv($range[0] + $range[1], 2);
                array_unshift($ranges, array($range[0], $mid), array($mid + 1, $range[1]));
                continue;
            }
            $usage['input_tokens'] += (int)($call['usage']['input_tokens'] ?? 0);
            $usage['output_tokens'] += (int)($call['usage']['output_tokens'] ?? 0);
            $ms += (int)($call['ms'] ?? 0);
            $rid = $call['request_id'] ?? $rid;
            $raw = ClaudeClient::toolInput($call['body'], self::TOOL) ?: array();

            if (!$customer && !empty($raw['customer_code'])) $customer = AiText::str($raw['customer_code'], 50);
            if (!$period && !empty($raw['period'])) $period = AiText::str($raw['period'], 100);
            $g = AiText::number($raw['report_grand_total'] ?? null);
            if ($g !== null) $grand = $g;

            foreach ((array)($raw['invoices'] ?? array()) as $iv) {
                $no = strtoupper(preg_replace('/\s+/', '', (string)($iv['doc_no'] ?? '')));
                $no = preg_replace('/-.*$/', '', $no); // ตัดเลขบรรทัด "-14" ทิ้ง ถ้า AI ติดมา
                if ($no === '') continue;
                $amt = AiText::number($iv['amount'] ?? null) ?? 0;
                $date = AiText::date((string)($iv['date'] ?? ''));
                if (!isset($docs[$no])) $docs[$no] = array('doc_no' => $no, 'date' => $date, 'lines' => 0, 'amount' => 0.0, 'unclear' => 0, 'page' => null);
                $docs[$no]['lines'] += (int)($iv['lines'] ?? 0);
                $docs[$no]['amount'] += $amt;
                $docs[$no]['unclear'] += (int)($iv['unclear_lines'] ?? 0);
                $pg = (int)($iv['page'] ?? 0);
                if ($pg > 0 && (!$docs[$no]['page'] || $pg < $docs[$no]['page'])) $docs[$no]['page'] = $pg;
                if ($date && (!$docs[$no]['date'] || $date < $docs[$no]['date'])) $docs[$no]['date'] = $date;
            }
        }
        foreach ($docs as &$d) $d['amount'] = round($d['amount'], 2);
        unset($d);
        uasort($docs, function ($a, $b) { return strcmp((string)$a['date'], (string)$b['date']) ?: strcmp($a['doc_no'], $b['doc_no']); });

        return array(
            'document' => array('customer_code' => $customer, 'period' => $period, 'report_total' => $grand,
                                'pages' => $pages, 'docs' => array_values($docs)),
            'usage' => $usage, 'ms' => $ms, 'request_id' => $rid,
        );
    }

    private function callOnce(array $fileBlock, array $range): array
    {
        $ask = "Read ONLY pages {$range[0]}-{$range[1]} of this PDF. For every sales line printed on these pages, "
             . "group by invoice number and record one entry per invoice with the tool. Do not record lines from other pages.";
        $payload = array(
            'model' => $this->model,
            'max_tokens' => 8000,
            'temperature' => 0,
            'system' => self::systemPrompt(),
            'tools' => array(self::toolSchema()),
            'tool_choice' => array('type' => 'tool', 'name' => self::TOOL),
            'messages' => array(array('role' => 'user', 'content' => array($fileBlock, array('type' => 'text', 'text' => $ask)))),
        );
        $call = $this->client->messages($payload);
        if (($call['body']['stop_reason'] ?? '') === 'max_tokens') throw new AiUserException('AI อ่านเอกสารไม่ครบ');
        return $call;
    }

    private static function systemPrompt(): string
    {
        return <<<TXT
You read a Thai "sales history by customer" report (รายงานประวัติการขาย แยกตามลูกค้า) printed by an old accounting system.
Layout: product heading lines, then detail lines: date (DD/MM/YY, Thai Buddhist year), document no like "IV0371320- 14", quantity+unit, unit price, VAT, amount (รวมเงิน), net amount (ยอดขายสุทธิ).
- The document no "IV0371320- 14" means invoice IV0371320, line 14. The invoice number is the part BEFORE the dash.
- For each invoice appearing on the requested pages: lines = number of detail lines, amount = SUM of the net amount column (ยอดขายสุทธิ) of those lines.
- IGNORE subtotal lines (รวมตาม ใบกำกับ, รวม <customer code>, รวมทั้งสิ้น) — they are not detail lines.
- date = the invoice date as printed (DD/MM/YY).
- page = the PDF page number (1-based, counting from the first page of the file) where this invoice's first line appears.
- unclear_lines = how many of its lines you could not read with confidence (0 if all clear).
- customer_code: the customer code in the page header (รหัสลูกค้า), e.g. BOOI. period: the date range in the header if visible.
- report_grand_total: ONLY if the "รวมทั้งสิ้น" grand total line appears on these pages, give its net amount; otherwise null.
Numbers: plain numbers without commas. Be exact — these totals are used for billing.
TXT;
    }

    private static function toolSchema(): array
    {
        return array(
            'name' => self::TOOL,
            'description' => 'Record per-invoice totals for the requested pages.',
            'input_schema' => array(
                'type' => 'object',
                'properties' => array(
                    'customer_code' => array('type' => array('string', 'null')),
                    'period' => array('type' => array('string', 'null')),
                    'report_grand_total' => array('type' => array('number', 'null')),
                    'invoices' => array('type' => 'array', 'items' => array(
                        'type' => 'object',
                        'properties' => array(
                            'doc_no' => array('type' => 'string'),
                            'date' => array('type' => array('string', 'null')),
                            'lines' => array('type' => 'integer'),
                            'amount' => array('type' => 'number'),
                            'unclear_lines' => array('type' => 'integer'),
                            'page' => array('type' => 'integer'),
                        ),
                        'required' => array('doc_no', 'lines', 'amount'),
                    )),
                ),
                'required' => array('invoices'),
            ),
        );
    }

    private static function pdfPageCount(string $bytes): int
    {
        $n = preg_match_all('/\/Type\s*\/Page(?!s)\b/', $bytes);
        if (!$n && preg_match_all('/\/Count\s+(\d+)/', $bytes, $m)) $n = max(array_map('intval', $m[1]));
        return max(1, (int)$n);
    }
}
