<?php
/* ============================================================================
   อ่านไฟล์ราคา (Excel) -> รายการสินค้า + ราคา สำหรับสร้างแคตตาล็อก

   รูปแบบไฟล์ต่างกันมาก (Q4 ของ Prevail วาง 2 รายการต่อแถวซ้าย/ขวา,
   Market List ของโรงแรมแยกชีต Veget/Meat/Seafood ...) จึงให้ AI อ่านจากข้อความ
   ทีละแถวพร้อมตัวอักษรคอลัมน์ (XlsxReader::toText) แทนการเขียน parser ตายตัว

   ชีตยาวจะแบ่งเป็นช่วงละ CHUNK แถว แต่ละช่วงแนบหัวตาราง/หัวหมวดที่เจอก่อนหน้าไปด้วย
   ============================================================================ */

final class CatalogReader
{
    public const TOOL = 'record_price_list';
    private const CHUNK = 40;

    private ClaudeClient $client;
    private string $model;
    /** usage รวมทุกครั้งที่เรียก */
    public array $usage = array('input_tokens' => 0, 'output_tokens' => 0, 'ms' => 0, 'calls' => 0);

    public function __construct(ClaudeClient $client, string $model)
    {
        $this->client = $client;
        $this->model = $model;
    }

    /** $sheets จาก XlsxReader::read  คืน ['meta' => [...], 'items' => [...]] */
    public function read(array $sheets, array $groupNames): array
    {
        $meta = array('title' => null, 'start_date' => null, 'stop_date' => null);
        $items = array();
        foreach ($sheets as $sh) {
            $lines = XlsxReader::toText($sh['rows']);
            /* ชีตที่มีแค่หัวตาราง (เช่น dtPrd ของไฟล์ Quote) ไม่ต้องเสียค่า AI */
            if (count($lines) < 2) continue;
            $rowNos = array_keys($lines);
            for ($i = 0; $i < count($rowNos); $i += self::CHUNK) {
                $part = array_slice($rowNos, $i, self::CHUNK);
                $context = $i > 0 ? self::contextRows($lines, $rowNos[$i]) : array();
                $res = $this->call($sh['name'], $lines, $part, $context, $groupNames, $i === 0 && !$items);
                foreach (array('title', 'start_date', 'stop_date') as $k) {
                    if ($meta[$k] === null && !empty($res['meta'][$k])) $meta[$k] = $res['meta'][$k];
                }
                foreach ($res['items'] as $it) {
                    $it['sheet'] = $sh['name'];
                    $items[] = $it;
                }
            }
        }
        return array('meta' => $meta, 'items' => $items);
    }

    /** แถวหัวตาราง/หัวหมวดก่อนหน้า (แถวที่ไม่มีตัวเลขราคา) ส่งไปเป็นบริบทให้ช่วงถัดไป */
    private static function contextRows(array $lines, int $beforeRow): array
    {
        $ctx = array();
        foreach ($lines as $rn => $txt) {
            if ($rn >= $beforeRow) break;
            $body = preg_replace('/^R\d+:\s*/', '', $txt);
            /* แถวต้นชีต, หัวตาราง, หัวหมวด (ไม่มีตัวเลขเลย) */
            if ($rn <= 6 || preg_match('/ลำดับ|รายการ|No\.|Item Nam/u', $body) || !preg_match('/\d/', $body)) {
                $ctx[$rn] = $txt;
            }
        }
        return array_slice($ctx, -25, null, true);
    }

    private function call(string $sheet, array $lines, array $part, array $context, array $groupNames, bool $wantMeta): array
    {
        $body = '';
        if ($context) $body .= "Earlier header/section rows of this sheet (context only, do not record them):\n" . implode("\n", $context) . "\n\n";
        $body .= "Sheet \"$sheet\" rows to read:\n";
        foreach ($part as $rn) $body .= $lines[$rn] . "\n";

        $payload = array(
            'model' => $this->model,
            'max_tokens' => 16000,
            'temperature' => 0,
            'system' => self::systemPrompt($groupNames),
            'tools' => array(self::toolSchema()),
            'tool_choice' => array('type' => 'tool', 'name' => self::TOOL),
            'messages' => array(array('role' => 'user', 'content' => array(
                array('type' => 'text', 'text' => $body . ($wantMeta ? "\nAlso fill meta from the sheet title rows." : '')),
            ))),
        );
        $call = $this->client->messages($payload);
        $this->usage['input_tokens'] += $call['usage']['input_tokens'];
        $this->usage['output_tokens'] += $call['usage']['output_tokens'];
        $this->usage['ms'] += $call['ms'];
        $this->usage['calls']++;
        $this->usage['request_id'] = $call['request_id'];
        $this->usage['workspace_id'] = $call['workspace_id'];
        // Discard truncated output and retry disjoint halves, preserving header context.
        // A single-row chunk is the terminal case: toolInput reports the failure.
        if (($call['body']['stop_reason'] ?? '') === 'max_tokens' && count($part) > 1) {
            $middle = (int)ceil(count($part) / 2);
            $leftRows = array_slice($part, 0, $middle);
            $rightRows = array_slice($part, $middle);
            $left = $this->call($sheet, $lines, $leftRows, $context, $groupNames, $wantMeta);
            $right = $this->call($sheet, $lines, $rightRows,
                self::contextRows($lines, $rightRows[0]), $groupNames, false);
            foreach (array('title', 'start_date', 'stop_date') as $key) {
                if ($left['meta'][$key] === null) $left['meta'][$key] = $right['meta'][$key];
            }
            return array('meta' => $left['meta'], 'items' => array_merge($left['items'], $right['items']));
        }
        return self::normalize(ClaudeClient::toolInput($call['body'], self::TOOL));
    }

    private static function systemPrompt(array $groupNames): string
    {
        $groups = $groupNames ? implode(', ', $groupNames) : '(none defined)';
        return <<<TXT
You read price-list spreadsheets of the Thai food wholesaler "Prevail International Food" (or market lists from hotel customers). Each row is given as "R<row>: <column>=<value> | ...". Your output becomes a customer price catalog that a clerk will check.

Rules:
- Record one item per product. The same row can contain SEVERAL products side by side (e.g. columns A-E and F-J are two separate lists). Use the column letters to keep them apart.
- Skip header rows ("ลำดับ", "No.", "รายการ...", "Item Names", "Unit"), company/address/title rows, totals and notes.
- name_th: Thai product name; name_en: English name if present (else null). Clean extra spaces; keep sizes like "200 กรัม" or "500 g".
- unit as written (kg, each, pack, EA, KG, ขีด, Brunch...).
- price: the selling price as a number. If the price cell is empty, "-", "/" or not a number, use null (the item still counts).
- Variants: if the name and the price both contain the same number of slash-separated parts, output one item per part, e.g.
  "กระเทียมไทยกลีบเล็ก/จุก" price "115/165" -> "กระเทียมไทยกลีบเล็ก" 115 and "กระเทียมไทยจุก" 165;
  "หอมแดงไทย/ปอกเปลือก" "115/180" -> "หอมแดงไทย" 115 and "หอมแดงไทยปอกเปลือก" 180;
  unit "each/kg" with price "2.9/59" -> same name, unit each 2.9 and unit kg 59.
  If only the name has slashes (one price), keep it as ONE item with the full name.
- group: the section the item belongs to, taken from the nearest section header above it in the SAME column block (e.g. "รายการผักบ้าน" -> "ผักบ้าน", "1. Fresh Vegetable", "Meat : Beef") or the sheet name. If it clearly matches one of the known catalog groups use that exact name: {$groups}. Otherwise write the header text without the word "รายการ".
- price: when there are both "Original Price" and "Price" (after discount) columns, use "Price". A price of 0 means not quoted -> null.
- Descriptions like "V-FRESH NEEM (ยอดสะเดา)" or "MINT LEAVE สะระแหน่": put the Thai part in name_th and the English part in name_en (drop codes/prefixes like "V-" only if they are clearly category codes).
- code: the customer's product code for that row if there is one (e.g. "Product Code", "Accpac Code"), else null.
- row: the R number of the row the item came from.
- Dates in cells may be Excel serial numbers (days since 1899-12-30, e.g. 46329 = 2026-11-03).
- meta (only when asked): title = a short catalog name from the title rows (e.g. "Q4 AZ 1-15 พ.ย. 2569"); start_date / stop_date = the price period as YYYY-MM-DD, converting Thai Buddhist years (2569 -> 2026, 69 -> 2026). null if not stated.
TXT;
    }

    private static function nullable(string $type): array
    {
        return array('type' => array($type, 'null'));
    }

    private static function toolSchema(): array
    {
        return array(
            'name' => self::TOOL,
            'description' => 'Record the products and prices found in the given rows.',
            'input_schema' => array(
                'type' => 'object',
                'properties' => array(
                    'meta' => array(
                        'type' => 'object',
                        'properties' => array(
                            'title' => self::nullable('string'),
                            'start_date' => self::nullable('string'),
                            'stop_date' => self::nullable('string'),
                        ),
                    ),
                    'items' => array(
                        'type' => 'array',
                        'description' => 'Each item is [row, name_th, name_en, unit, price, group, code]',
                        'items' => array(
                            'type' => 'array',
                            'items' => array('type' => array('string', 'number', 'null')),
                            'minItems' => 7,
                            'maxItems' => 7,
                        ),
                    ),
                ),
                'required' => array('items'),
            ),
        );
    }

    public static function normalize(array $raw): array
    {
        $m = is_array($raw['meta'] ?? null) ? $raw['meta'] : array();
        $items = array();
        foreach (($raw['items'] ?? array()) as $r) {
            if (!is_array($r) || count($r) < 5) continue;
            $th = AiText::str($r[1] ?? null, 255);
            $en = AiText::str($r[2] ?? null, 255);
            if ($th === null && $en === null) continue;
            $items[] = array(
                'row' => is_numeric($r[0] ?? null) ? (int)$r[0] : null,
                'name' => $th ?? $en,
                'name_en' => $th !== null ? $en : null,
                'unit' => AiText::str($r[3] ?? null, 30),
                'price' => AiText::number($r[4] ?? null),
                'group' => AiText::str($r[5] ?? null, 150),
                'code' => AiText::str($r[6] ?? null, 50),
            );
        }
        return array(
            'meta' => array(
                'title' => AiText::str($m['title'] ?? null, 200),
                'start_date' => AiText::date($m['start_date'] ?? null),
                'stop_date' => AiText::date($m['stop_date'] ?? null),
            ),
            'items' => $items,
        );
    }

    /** โหมดจำลอง: ดึงแบบง่ายจากแถวที่มี ชื่อ + ตัวเลขราคา (ไม่เรียก AI) */
    public static function mock(array $sheets): array
    {
        $items = array();
        foreach ($sheets as $sh) {
            foreach ($sh['rows'] as $rn => $cells) {
                $vals = array_values($cells);
                $cols = array_keys($cells);
                for ($i = 0; $i < count($vals); $i++) {
                    if (!is_numeric($vals[$i]) || !isset($vals[$i + 1]) || is_numeric($vals[$i + 1])) continue;
                    $name = trim((string)$vals[$i + 1]);
                    $price = null;
                    for ($j = $i + 2; $j < min($i + 5, count($vals)); $j++) {
                        if (is_numeric($vals[$j])) { $price = (float)$vals[$j]; break; }
                    }
                    if ($name !== '' && mb_strlen($name) > 1) {
                        $items[] = array('row' => $rn, 'name' => $name, 'name_en' => null, 'unit' => null, 'price' => $price, 'group' => $sh['name'], 'sheet' => $sh['name'], 'code' => null);
                    }
                }
                if (count($items) >= 40) break 2;
            }
        }
        return array('meta' => array('title' => 'นำเข้าทดสอบ (โหมดจำลอง)', 'start_date' => null, 'stop_date' => null), 'items' => $items);
    }
}
