<?php
/* ============================================================================
   อ่าน PO / ใบขอซื้อ (Purchase Request / Purchase Order) ที่ "ลูกค้า" ส่งมาให้ Prevail
   -> ข้อมูลมีโครงสร้าง เพื่อสร้างใบขายสินค้า (ร่าง สถานะ "รอยืนยัน")

   ต่างจาก DocReader (ใบส่งของจากผู้ขาย):
   - คนออกเอกสาร = ลูกค้า (โรงแรม/ร้านอาหาร) ส่วน Prevail เป็นผู้ขาย
   - ไฟล์เดียวมีได้หลายใบสั่ง (เช่น PDF 22 หน้า = Purchase Request หลายใบ)
     และใบเดียวแบ่งหลายครัว/จุดส่ง (ครัวเมน / ครัวพนักงาน)
     -> คืนเป็น orders[] แยกตาม เลขที่ PO + จุดส่ง + วันส่ง  แต่ละ order = ใบขายสินค้า 1 ใบ
   ============================================================================ */

final class PoReader
{
    public const TOOL = 'record_customer_orders';

    private ClaudeClient $client;
    private string $model;

    public function __construct(ClaudeClient $client, string $model)
    {
        $this->client = $client;
        $this->model = $model;
    }

    /** จำนวนหน้าต่อการเรียก AI 1 ครั้ง — PDF หลายหน้าผลลัพธ์ยาวเกินที่ AI ตอบได้ในครั้งเดียว */
    private const PAGES_PER_CALL = 4;

    public function read(string $path, string $mime): array
    {
        $bytes = file_get_contents($path);
        if ($bytes === false) throw new RuntimeException('อ่านไฟล์ที่อัปโหลดไม่ได้');

        $isPdf = $mime === 'application/pdf';
        /* cache_control: แบ่งอ่านหลายรอบ ส่งไฟล์เดิมซ้ำ ให้ API จำไฟล์ไว้ รอบถัดไปคิดค่า input ถูกลงมาก */
        $fileBlock = $isPdf
            ? array('type' => 'document', 'source' => array('type' => 'base64', 'media_type' => 'application/pdf', 'data' => base64_encode($bytes)), 'cache_control' => array('type' => 'ephemeral'))
            : array('type' => 'image', 'source' => array('type' => 'base64', 'media_type' => $mime, 'data' => base64_encode($bytes)));

        $pages = $isPdf ? self::pdfPageCount($bytes) : 1;
        $ranges = array();
        if ($pages <= self::PAGES_PER_CALL) {
            $ranges[] = null; // อ่านทั้งไฟล์ครั้งเดียว
        } else {
            for ($a = 1; $a <= $pages; $a += self::PAGES_PER_CALL) $ranges[] = array($a, min($pages, $a + self::PAGES_PER_CALL - 1));
        }

        $calls = array();
        $merged = null;
        while ($ranges) {
            $range = array_shift($ranges);
            try {
                $call = $this->callOnce($fileBlock, $range);
            } catch (AiUserException $e) {
                /* ช่วงนี้รายการเยอะจน AI ตอบไม่จบ -> แบ่งครึ่งแล้วอ่านใหม่ (เหลือหน้าเดียวแล้วยังไม่จบค่อยแจ้งผู้ใช้) */
                $tooLong = strpos($e->getMessage(), 'ไม่ครบ') !== false || strpos($e->getMessage(), 'ไม่จบ') !== false;
                if (!$tooLong) throw $e;
                if ($range === null && $isPdf && $pages > 1) {
                    $range = array(1, $pages);
                }
                if ($range === null || $range[0] === $range[1]) {
                    throw new AiUserException('AI อ่านเอกสารไม่ครบ (หน้า ' . ($range ? $range[0] : 1) . ' มีรายการมากเกินไป) กรุณาแบ่งไฟล์แล้วนำเข้าใหม่');
                }
                $mid = intdiv($range[0] + $range[1], 2);
                array_unshift($ranges, array($range[0], $mid), array($mid + 1, $range[1]));
                continue;
            }
            $calls[] = $call;
            $doc = self::normalize(ClaudeClient::toolInput($call['body'], self::TOOL));
            $merged = $merged === null ? $doc : self::merge($merged, $doc);
        }

        /* รวม usage ทุกครั้งที่เรียก ให้ so-import.php บันทึกเป็นรายการเดียว */
        $last = end($calls);
        $usage = array('input_tokens' => 0, 'output_tokens' => 0);
        $ms = 0;
        foreach ($calls as $c) {
            $usage['input_tokens'] += $c['usage']['input_tokens'];
            $usage['output_tokens'] += $c['usage']['output_tokens'];
            $ms += $c['ms'];
        }
        $call = array('body' => $last['body'], 'usage' => $usage, 'ms' => $ms,
            'request_id' => $last['request_id'], 'workspace_id' => $last['workspace_id'], 'calls' => count($calls));
        /* เลข PO เดียวกัน = ใบขายสินค้าใบเดียว แม้ AI แยกตามครัว/จุดส่ง/วันส่ง */
        $merged = self::groupByPo($merged);
        return array('document' => $merged, 'call' => $call);
    }

    private function callOnce(array $fileBlock, ?array $range): array
    {
        $ask = $range === null
            ? 'Read every order in this customer document and record them with the tool.'
            : "Read ONLY pages {$range[0]}-{$range[1]} of this PDF and record the order lines printed on those pages with the tool. "
              . "If an order started on an earlier page, still record its lines from these pages and repeat its po_no / delivery_date / location (look at the earlier page header if needed). "
              . "Do not record lines from other pages. If these pages have no order lines, return an empty orders array.";

        $payload = array(
            'model' => $this->model,
            'max_tokens' => 20000,
            'temperature' => 0,
            'system' => self::systemPrompt(),
            'tools' => array(self::toolSchema()),
            'tool_choice' => array('type' => 'tool', 'name' => self::TOOL),
            'messages' => array(array(
                'role' => 'user',
                'content' => array($fileBlock, array('type' => 'text', 'text' => $ask)),
            )),
        );
        $call = $this->client->messages($payload);
        if (($call['body']['stop_reason'] ?? '') === 'max_tokens') throw new AiUserException('AI อ่านเอกสารไม่ครบ');
        return $call;
    }

    /** นับหน้า PDF แบบคร่าวๆ จากโครงสร้างไฟล์ (นับไม่ได้ถือว่า 1 หน้า = อ่านครั้งเดียวเหมือนเดิม) */
    private static function pdfPageCount(string $bytes): int
    {
        $n = preg_match_all('/\/Type\s*\/Page(?!s)\b/', $bytes);
        if (!$n && preg_match_all('/\/Count\s+(\d+)/', $bytes, $m)) $n = max(array_map('intval', $m[1]));
        return max(1, (int)$n);
    }

    /** รวมผลหลายช่วงหน้า: order เดียวกัน (PO + จุดส่ง + วันส่ง) ต่อรายการกัน */
    /** รวม order ที่เลข PO เดียวกันเป็นใบเดียว: รายการต่อกัน, ครัว/จุดส่งรวมเป็นข้อความเดียว, วันส่ง = วันแรกสุด
        order ที่ไม่มีเลข PO ไม่รวม (แยกใบตามเดิม) */
    private static function groupByPo(array $doc): array
    {
        $out = array();
        $idx = array();
        foreach (($doc['orders'] ?? array()) as $o) {
            $po = mb_strtolower(trim((string)($o['po_no'] ?? '')));
            if ($po === '' || !isset($idx[$po])) {
                if ($po !== '') $idx[$po] = count($out);
                $out[] = $o;
                continue;
            }
            $t = &$out[$idx[$po]];
            $t['lines'] = array_merge($t['lines'], $o['lines']);
            foreach (array('delivery_date', 'order_date') as $k) {
                if (!empty($o[$k]) && (empty($t[$k]) || $o[$k] < $t[$k])) $t[$k] = $o[$k];
            }
            $locs = array_filter(array_map('trim', explode(',', (string)($t['location'] ?? ''))));
            if (!empty($o['location']) && !in_array(trim($o['location']), $locs, true)) $locs[] = trim($o['location']);
            $t['location'] = $locs ? mb_substr(implode(', ', $locs), 0, 100) : null;
            unset($t);
        }
        $doc['orders'] = $out;
        return $doc;
    }

    private static function merge(array $a, array $b): array
    {
        if (empty($a['customer']['name']) && !empty($b['customer']['name'])) $a['customer'] = $b['customer'];
        $key = function ($o) {
            return mb_strtolower(trim(($o['po_no'] ?? '') . '|' . ($o['location'] ?? '') . '|' . ($o['delivery_date'] ?? '')));
        };
        $idx = array();
        foreach ($a['orders'] as $i => $o) $idx[$key($o)] = $i;
        foreach ($b['orders'] as $o) {
            $k = $key($o);
            if (isset($idx[$k])) {
                $a['orders'][$idx[$k]]['lines'] = array_merge($a['orders'][$idx[$k]]['lines'], $o['lines']);
            } else {
                $idx[$k] = count($a['orders']);
                $a['orders'][] = $o;
            }
        }
        $notes = array_filter(array($a['notes'] ?? null, $b['notes'] ?? null));
        $a['notes'] = $notes ? mb_substr(implode(' / ', array_unique($notes)), 0, 1000) : null;
        return $a;
    }

    private static function systemPrompt(): string
    {
        return <<<TXT
You read purchase documents that CUSTOMERS (hotels, resorts, restaurants in Phuket) send to the food wholesaler "Prevail International Food" (พรีเวล อินเตอร์เนชั่นแนล ฟู้ด). Documents: Purchase Order (PO), Purchase Request (PR), ใบสั่งซื้อ, ใบขอซื้อ — printed, exported from purchasing systems, or handwritten forms. Your output becomes draft sales orders (ใบขายสินค้า) that a sales clerk will check.

Rules:
- Record only what is on the document. Never invent values. Use null when missing or unreadable.
- customer = the organisation that ISSUED the order (letterhead / buyer / "Order by"), never Prevail (Prevail is the vendor / "Order For" / "To"). tax_id: the customer's 13-digit tax ID if printed, digits only.
- One file may contain MANY separate orders (e.g. many Purchase Requests one after another, each with its own Request No.). A single order may also be split into several kitchens / outlets / delivery locations (e.g. columns "ครัวเมน" and "ครัวพนักงาน", "Outlet: Kitchen Canteen", "Delivery Location: OCEAN VIEW - Kitchen").
  Output one entry in orders[] for EACH distinct combination of (order number, delivery location/kitchen, delivery date). Pages that continue the same order belong to the same entry.
- po_no: the order's own number (PO Number / Request No. / PR No. / เลขที่). If several numbers are printed, prefer the PO number, else the PR/Request number.
- order_date: the date the order was made. delivery_date: requested delivery date (Delivery Date / วันที่ส่ง / "เข้า 02/11"). Dates as YYYY-MM-DD; convert Thai Buddhist years (2569 or 69 -> 2026). Thai digits count as 0-9.
- Read the value under DEPARTMENT / Department / Kitchen / Outlet as the kitchen location, including its numeric suffix (for example, DEPARTMENT: Sunset Kitchen 250 becomes location "Sunset Kitchen 250"). Never invent a test kitchen or substitute a demonstration value.
- location: the kitchen / outlet / delivery location / department name as printed (e.g. "201 OCEAN VIEW - Kitchen", "ครัวพนักงาน", "5700 - Kitchen Canteen"). null if none.
- lines: include EVERY product row, even if its item code is blank (code=null). Row numbers are not item codes. Keep wrapped descriptions in one row, but never merge distinct product rows. Include fractional quantities. Count all rows visually and check the output count. Skip only subtotal, tax, delivery charge, signature and note rows.
  - name: product description exactly as printed, keeping BOTH Thai and English if both appear (e.g. "Veg Kale คะน้า"). For handwritten Thai, write your best reading.
  - code: the customer's item code if printed (it can be Thai text in a "Code" column), else null.
  - qty: ordered quantity as a number. unit: as printed (Kilogram, kg, กก., ขีด, Pack 800 G, Each, PCS, ลูก ...). If the unit is ขีด keep "ขีด" (do not convert).
  - unit_price and amount only if printed, else null.
  - confidence: high = clearly legible, medium = partly unclear, low = guessed (blurry or messy handwriting).
- notes: short Thai notes for the sales clerk (illegible rows, crossed-out items, pages that seem missing, special delivery instructions). null if nothing.
TXT;
    }

    private static function nullable(string $type, string $description = ''): array
    {
        $s = array('type' => array($type, 'null'));
        if ($description !== '') $s['description'] = $description;
        return $s;
    }

    private static function toolSchema(): array
    {
        return array(
            'name' => self::TOOL,
            'description' => 'Record all customer orders found in the document.',
            'input_schema' => array(
                'type' => 'object',
                'properties' => array(
                    'customer' => array(
                        'type' => 'object',
                        'properties' => array(
                            'name' => self::nullable('string', 'Customer (issuer) name as printed'),
                            'tax_id' => self::nullable('string', 'Digits only'),
                            'branch' => self::nullable('string'),
                        ),
                        'required' => array('name', 'tax_id'),
                    ),
                    'orders' => array(
                        'type' => 'array',
                        'items' => array(
                            'type' => 'object',
                            'properties' => array(
                                'po_no' => self::nullable('string'),
                                'order_date' => self::nullable('string', 'YYYY-MM-DD'),
                                'delivery_date' => self::nullable('string', 'YYYY-MM-DD'),
                                'location' => self::nullable('string'),
                                'lines' => array(
                                    'type' => 'array',
                                    'items' => array(
                                        'type' => 'object',
                                        'properties' => array(
                                            'name' => array('type' => 'string'),
                                            'code' => self::nullable('string'),
                                            'qty' => self::nullable('number'),
                                            'unit' => self::nullable('string'),
                                            'unit_price' => self::nullable('number'),
                                            'amount' => self::nullable('number'),
                                            'confidence' => array('type' => 'string', 'enum' => array('high', 'medium', 'low')),
                                        ),
                                        'required' => array('name', 'qty', 'unit', 'confidence'),
                                    ),
                                ),
                            ),
                            'required' => array('po_no', 'delivery_date', 'location', 'lines'),
                        ),
                    ),
                    'notes' => self::nullable('string'),
                ),
                'required' => array('customer', 'orders'),
            ),
        );
    }

    /** ไม่เชื่อ AI 100% — ตรวจชนิดข้อมูลทุกช่อง */
    public static function normalize(array $raw): array
    {
        $cus = is_array($raw['customer'] ?? null) ? $raw['customer'] : array();
        $tax = AiText::digits($cus['tax_id'] ?? null);

        $orders = array();
        foreach (($raw['orders'] ?? array()) as $o) {
            if (!is_array($o)) continue;
            $lines = array();
            foreach (($o['lines'] ?? array()) as $l) {
                if (!is_array($l)) continue;
                $name = AiText::str($l['name'] ?? null);
                if ($name === null) throw new AiUserException('อ่านชื่อสินค้าไม่ครบ กรุณาตรวจเอกสารแล้วนำเข้าใหม่');
                $conf = $l['confidence'] ?? 'medium';
                $lines[] = array(
                    'name' => $name,
                    'code' => AiText::str($l['code'] ?? null, 100),
                    'qty' => AiText::number($l['qty'] ?? null),
                    'unit' => AiText::str($l['unit'] ?? null, 50),
                    'unit_price' => AiText::number($l['unit_price'] ?? null),
                    'amount' => AiText::number($l['amount'] ?? null),
                    'confidence' => in_array($conf, array('high', 'medium', 'low'), true) ? $conf : 'medium',
                );
            }
            if (!$lines) continue;
            $orders[] = array(
                'po_no' => AiText::str($o['po_no'] ?? null, 100),
                'order_date' => AiText::date($o['order_date'] ?? null),
                'delivery_date' => AiText::date($o['delivery_date'] ?? null),
                'location' => AiText::str($o['location'] ?? null, 100),
                'lines' => $lines,
            );
        }

        return array(
            'customer' => array(
                'name' => AiText::str($cus['name'] ?? null),
                'tax_id' => strlen($tax) >= 10 ? $tax : null,
                'branch' => AiText::str($cus['branch'] ?? null, 100),
            ),
            'orders' => $orders,
            'notes' => AiText::str($raw['notes'] ?? null, 1000),
        );
    }

    /** โหมดจำลอง (AI_MOCK=1): สร้าง PO ปลอมจากลูกค้าที่มีแคตตาล็อกราคาจริง */
    public static function mock(PDO $conn): array
    {
        $cus = $conn->query("
            SELECT c.cuscode, c.cusname, c.taxnumber, COUNT(*) n
            FROM catalog_link a
            JOIN catalog_master m ON m.catalog_code = a.catalog_code AND m.active_status = 'Y'
            JOIN catalog_detail d ON d.catalog_code = a.catalog_code
            JOIN customer c ON c.cuscode = a.cuscode AND c.active_status = 'Y'
            GROUP BY c.cuscode, c.cusname, c.taxnumber ORDER BY n DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        if (!$cus) {
            $cus = $conn->query("SELECT cuscode, cusname, taxnumber FROM customer WHERE active_status = 'Y' LIMIT 1")->fetchAll(PDO::FETCH_ASSOC);
        }
        $c = $cus ? $cus[array_rand($cus)] : array('cuscode' => null, 'cusname' => 'ลูกค้าทดสอบ', 'taxnumber' => null);

        $st = $conn->prepare("
            SELECT i.stname, i.unit, d.price FROM catalog_link a
            JOIN catalog_detail d ON d.catalog_code = a.catalog_code
            JOIN items i ON i.stcode = d.stcode
            WHERE a.cuscode = :c ORDER BY RAND() LIMIT 5");
        $st->execute(array('c' => $c['cuscode']));
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) $rows = $conn->query("SELECT stname, unit, 0 price FROM items WHERE active_status='Y' ORDER BY RAND() LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

        $lines = array();
        foreach (array_values($rows) as $k => $r) {
            $lines[] = array(
                'name' => $k === 4 ? 'สินค้าที่ไม่มีในระบบ (ทดสอบจับคู่เอง)' : (string)$r['stname'],
                'code' => null, 'qty' => array(3, 2, 0.5, 5, 1)[$k % 5], 'unit' => $r['unit'],
                'unit_price' => null, 'amount' => null, 'confidence' => $k === 4 ? 'low' : 'high',
            );
        }
        $tomorrow = (new DateTimeImmutable('tomorrow'))->format('Y-m-d');
        return array(
            'customer' => array('name' => $c['cusname'], 'tax_id' => $c['taxnumber'] ?: null, 'branch' => null),
            'orders' => array(array(
                'po_no' => 'MOCK-' . date('His'), 'order_date' => date('Y-m-d'),
                'delivery_date' => $tomorrow, 'location' => 'ครัวทดสอบ', 'lines' => $lines,
            )),
            'notes' => 'โหมดจำลอง (AI_MOCK=1) — ไม่ได้อ่านไฟล์จริง',
        );
    }
}
