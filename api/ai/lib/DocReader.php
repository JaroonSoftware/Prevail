<?php
/* ============================================================================
   อ่านรูป/PDF ใบส่งของ ใบกำกับภาษี ใบแจ้งหนี้ -> ข้อมูลมีโครงสร้าง
   บังคับให้ Claude ตอบผ่าน tool เดียว ผลลัพธ์จึงเป็น JSON ตาม schema เสมอ
   ============================================================================ */

final class DocReader
{
    public const TOOL = 'record_delivery_document';

    private ClaudeClient $client;
    private string $model;

    public function __construct(ClaudeClient $client, string $model)
    {
        $this->client = $client;
        $this->model = $model;
    }

    /** คืน array('document' => ข้อมูลที่ normalize แล้ว, 'call' => ผลการเรียก API) */
    public function read(string $path, string $mime): array
    {
        $bytes = file_get_contents($path);
        if ($bytes === false) throw new RuntimeException('อ่านไฟล์ที่อัปโหลดไม่ได้');

        $fileBlock = $mime === 'application/pdf'
            ? array('type' => 'document', 'source' => array('type' => 'base64', 'media_type' => 'application/pdf', 'data' => base64_encode($bytes)))
            : array('type' => 'image', 'source' => array('type' => 'base64', 'media_type' => $mime, 'data' => base64_encode($bytes)));

        $payload = array(
            'model' => $this->model,
            'max_tokens' => 8000,
            'temperature' => 0,
            'system' => self::systemPrompt(),
            'tools' => array(self::toolSchema()),
            'tool_choice' => array('type' => 'tool', 'name' => self::TOOL),
            'messages' => array(array(
                'role' => 'user',
                'content' => array(
                    $fileBlock,
                    array('type' => 'text', 'text' => 'Read this supplier document and record it with the tool.'),
                ),
            )),
        );

        $call = $this->client->messages($payload);
        $raw = ClaudeClient::toolInput($call['body'], self::TOOL);
        return array('document' => self::normalize($raw), 'call' => $call);
    }

    private static function systemPrompt(): string
    {
        return <<<TXT
You read supplier documents (Thai: ใบส่งของ, ใบส่งสินค้า, ใบกำกับภาษี, ใบแจ้งหนี้, ใบเสร็จ, บิลเงินสด — printed or handwritten; English: delivery note, tax invoice, invoice) photographed by a Thai food wholesaler that buys dry goods, noodles, fresh produce, meat and fruit. Your output pre-fills a purchase record (ใบสั่งซื้อ) that adds the goods to stock, and a purchasing clerk will check it.

Rules:
- Record only what is actually on the document. Never invent values. Use null when a field is missing or unreadable.
- The supplier is the company that ISSUED the document (letterhead / seller), not the buyer ("ลูกค้า", "Sold to", "Ship to").
- tax_id: the supplier's 13-digit Thai tax ID (เลขประจำตัวผู้เสียภาษี) if printed, digits only.
- document_no: the document's own number (เลขที่ / No. / Doc No. / Invoice No.). po_reference: the buyer's purchase-order number if printed (PO / ใบสั่งซื้อเลขที่ / อ้างอิง).
- Dates as YYYY-MM-DD. Thai Buddhist years (พ.ศ., e.g. 2569 or 69) must be converted to Gregorian (2569 -> 2026). Thai digits ๐-๙ count as 0-9.
- lines: one entry per product row. Do NOT add rows for subtotal, discount, VAT, shipping, deposit or notes.
  - name: the product name exactly as printed (keep both Thai and English text if both appear; include pack size such as "25 kg" if it is part of the name).
  - code: the supplier's item code if printed, else null.
  - qty: the delivered quantity as a number (no commas, decimals allowed for weights). unit: as printed (e.g. กก., ถุง, ลัง, แพ็ค, KG).
  - unit_price: price per unit as printed. amount: the row total as printed. discount: a discount in baht printed for that row, else null.
  - If a printed quantity is crossed out and a handwritten quantity is written next to it, use the handwritten one and mention it in notes.
  - lot_no / mfg_date / exp_date: if the row (or a sub-line under it) shows Lot/Batch, MFG/ผลิต, EXP/หมดอายุ/BBE. If one product shows several lots, output one line per lot.
  - confidence: high = clearly legible, medium = partly unclear, low = guessed from blurry text.
- notes: short Thai notes for the purchasing clerk about anything unclear, handwritten corrections, stamps covering text, or a second page that seems missing. null if nothing.
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
            'description' => 'Record the contents of one supplier delivery document.',
            'input_schema' => array(
                'type' => 'object',
                'properties' => array(
                    'document_type' => array('type' => 'string', 'enum' => array('delivery_note', 'tax_invoice', 'invoice', 'receipt', 'other')),
                    'supplier' => array(
                        'type' => 'object',
                        'properties' => array(
                            'name' => self::nullable('string', 'Issuing company name as printed'),
                            'tax_id' => self::nullable('string', 'Digits only'),
                            'branch' => self::nullable('string'),
                            'phone' => self::nullable('string'),
                        ),
                        'required' => array('name', 'tax_id'),
                    ),
                    'document_no' => self::nullable('string'),
                    'document_date' => self::nullable('string', 'YYYY-MM-DD (Gregorian)'),
                    'po_reference' => self::nullable('string'),
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
                                'discount' => self::nullable('number', 'Row discount in baht'),
                                'lot_no' => self::nullable('string'),
                                'mfg_date' => self::nullable('string', 'YYYY-MM-DD'),
                                'exp_date' => self::nullable('string', 'YYYY-MM-DD'),
                                'confidence' => array('type' => 'string', 'enum' => array('high', 'medium', 'low')),
                            ),
                            'required' => array('name', 'qty', 'unit', 'confidence'),
                        ),
                    ),
                    'subtotal' => self::nullable('number'),
                    'vat' => self::nullable('number'),
                    'grand_total' => self::nullable('number'),
                    'notes' => self::nullable('string'),
                ),
                'required' => array('document_type', 'supplier', 'document_no', 'document_date', 'lines'),
            ),
        );
    }

    /** ทำความสะอาดผลที่ได้ — ไม่เชื่อ AI 100% ตรวจชนิดข้อมูลทุกช่อง */
    public static function normalize(array $raw): array
    {
        $sup = is_array($raw['supplier'] ?? null) ? $raw['supplier'] : array();
        $tax = AiText::digits($sup['tax_id'] ?? null);

        $lines = array();
        foreach (($raw['lines'] ?? array()) as $l) {
            if (!is_array($l)) continue;
            $name = AiText::str($l['name'] ?? null);
            if ($name === null) continue;
            $conf = $l['confidence'] ?? 'medium';
            $lines[] = array(
                'name' => $name,
                'code' => AiText::str($l['code'] ?? null, 100),
                'qty' => AiText::number($l['qty'] ?? null),
                'unit' => AiText::str($l['unit'] ?? null, 50),
                'unit_price' => AiText::number($l['unit_price'] ?? null),
                'amount' => AiText::number($l['amount'] ?? null),
                'discount' => AiText::number($l['discount'] ?? null),
                'lot_no' => AiText::str($l['lot_no'] ?? null, 100),
                'mfg_date' => AiText::date($l['mfg_date'] ?? null),
                'exp_date' => AiText::date($l['exp_date'] ?? null),
                'confidence' => in_array($conf, array('high', 'medium', 'low'), true) ? $conf : 'medium',
            );
        }

        $type = $raw['document_type'] ?? 'other';
        return array(
            'document_type' => in_array($type, array('delivery_note', 'tax_invoice', 'invoice', 'receipt', 'other'), true) ? $type : 'other',
            'supplier' => array(
                'name' => AiText::str($sup['name'] ?? null),
                'tax_id' => strlen($tax) >= 10 ? $tax : null,
                'branch' => AiText::str($sup['branch'] ?? null, 100),
                'phone' => AiText::str($sup['phone'] ?? null, 50),
            ),
            'document_no' => AiText::str($raw['document_no'] ?? null, 100),
            'document_date' => AiText::date($raw['document_date'] ?? null),
            'po_reference' => AiText::str($raw['po_reference'] ?? null, 100),
            'lines' => $lines,
            'subtotal' => AiText::number($raw['subtotal'] ?? null),
            'vat' => AiText::number($raw['vat'] ?? null),
            'grand_total' => AiText::number($raw['grand_total'] ?? null),
            'notes' => AiText::str($raw['notes'] ?? null, 1000),
        );
    }
}
