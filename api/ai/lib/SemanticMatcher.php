<?php
/* ============================================================================
   ให้ AI ช่วยจับคู่ชื่อสินค้า — ใช้เฉพาะแถวที่เทียบตัวอักษรแล้วไม่มั่นใจ
   เช่น บิลเขียนว่า "วุ้นเส้น ตราต้นสน 500g" แต่ในระบบชื่อ "วุ้นเส้นต้นสน 500 กรัม"
   เป็นงานข้อความล้วน ใช้รุ่นราคาถูกได้ ค่าใช้จ่ายต่อครั้งน้อยมาก
   ============================================================================ */

final class SemanticMatcher
{
    public const TOOL = 'match_lines';

    private ClaudeClient $client;
    private string $model;

    public function __construct(ClaudeClient $client, string $model)
    {
        $this->client = $client;
        $this->model = $model;
    }

    /**
     * $lines  ผลจาก ItemMatcher::matchLines()['lines']
     * $which  index ของแถวที่ต้องการให้ช่วย
     * $pool   สินค้าที่เป็นตัวเลือก (ItemMatcher::semanticPool)
     * คืน array('matches' => [[i, code, confidence, reason]...], 'usage' => ...)
     */
    public function match(array $lines, array $which, array $pool): array
    {
        $docLines = array();
        foreach ($which as $i) {
            $d = $lines[$i]['doc'];
            $docLines[] = array('i' => $i, 'name' => $d['name'], 'code' => $d['code'], 'qty' => $d['qty'], 'unit' => $d['unit']);
        }
        /* $pool มาจาก ItemMatcher::semanticPool() : [{code, name, unit, type}] */
        $cands = array_values($pool);

        $payload = array(
            'model' => $this->model,
            'max_tokens' => 2000,
            'temperature' => 0,
            'system' => "You match product lines from a Thai supplier's bill or delivery note to items in a Thai food wholesaler's product catalog.\n"
                . "Names may be in Thai on one side and English on the other, abbreviated, or include pack sizes. "
                . "Match by meaning (same product), not by spelling alone. Different sizes, grades or flavours are different products. "
                . "If no candidate is clearly the same product, return code null. Never force a match. "
                . "confidence: high = certainly the same product, medium = probably, low = unsure. "
                . "reason: a few Thai words explaining the match.",
            'tools' => array(array(
                'name' => self::TOOL,
                'description' => 'Return one match per delivery-note line.',
                'input_schema' => array(
                    'type' => 'object',
                    'properties' => array(
                        'matches' => array(
                            'type' => 'array',
                            'items' => array(
                                'type' => 'object',
                                'properties' => array(
                                    'i' => array('type' => 'integer'),
                                    'code' => array('type' => array('string', 'null')),
                                    'confidence' => array('type' => 'string', 'enum' => array('high', 'medium', 'low')),
                                    'reason' => array('type' => 'string'),
                                ),
                                'required' => array('i', 'code', 'confidence'),
                            ),
                        ),
                    ),
                    'required' => array('matches'),
                ),
            )),
            'tool_choice' => array('type' => 'tool', 'name' => self::TOOL),
            'messages' => array(array(
                'role' => 'user',
                'content' => json_encode(array('delivery_note_lines' => $docLines, 'catalog_items' => $cands), JSON_UNESCAPED_UNICODE),
            )),
        );

        $call = $this->client->messages($payload);
        $out = ClaudeClient::toolInput($call['body'], self::TOOL);

        $matches = array();
        foreach (($out['matches'] ?? array()) as $m) {
            if (!is_array($m) || !isset($m['i'])) continue;
            $matches[] = array(
                'i' => (int)$m['i'],
                'code' => isset($m['code']) && $m['code'] !== '' ? (string)$m['code'] : null,
                'confidence' => $m['confidence'] ?? 'low',
                'reason' => $m['reason'] ?? null,
            );
        }
        return array('matches' => $matches, 'usage' => $call['usage'] + array('ms' => $call['ms'], 'request_id' => $call['request_id'], 'workspace_id' => $call['workspace_id']));
    }
}
