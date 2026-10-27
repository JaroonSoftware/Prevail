<?php
/* ============================================================================
   โหมดจำลอง (AI_MOCK=1) — ไม่เรียก AI จริง ไม่เสียเงิน
   สร้าง "บิลปลอม" จากผู้ขายและสินค้าที่มีอยู่จริงในฐานข้อมูล Prevail
   แล้วแกล้งสะกดชื่อให้ต่างจากในระบบนิดหน่อย เพื่อทดสอบการจับคู่ได้ทั้ง flow
   ============================================================================ */

final class MockDoc
{
    public static function build(PDO $conn): array
    {
        $today = new DateTimeImmutable('today');

        /* ผู้ขายที่ผูกสินค้าไว้มากที่สุด (สุ่มจาก 5 อันดับแรก ให้แต่ละครั้งไม่ซ้ำกัน) */
        $sups = $conn->query("
            SELECT s.supcode, s.supname, s.taxnumber, COUNT(*) AS n
            FROM supplier_items si
            JOIN supplier s ON s.supcode = si.supcode
            JOIN items i ON i.stcode = si.stcode AND i.active_status = 'Y'
            WHERE s.active_status = 'Y'
            GROUP BY s.supcode, s.supname, s.taxnumber
            ORDER BY n DESC
            LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

        if ($sups) {
            $sup = $sups[array_rand($sups)];
            $st = $conn->prepare("
                SELECT i.stcode, i.stname, i.unit, i.buyprice
                FROM supplier_items si JOIN items i ON i.stcode = si.stcode
                WHERE si.supcode = :s AND i.active_status = 'Y'
                ORDER BY RAND() LIMIT 4");
            $st->execute(array('s' => $sup['supcode']));
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
        } else {
            /* ยังไม่ได้ผูกสินค้ากับผู้ขาย — ใช้ผู้ขายรายแรก + สินค้าสุ่ม */
            $sup = $conn->query("SELECT supcode, supname, taxnumber FROM supplier WHERE active_status = 'Y' ORDER BY supcode LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            $rows = $conn->query("SELECT stcode, stname, unit, buyprice FROM items WHERE active_status = 'Y' ORDER BY RAND() LIMIT 4")->fetchAll(PDO::FETCH_ASSOC);
        }

        if (!$sup || !$rows) return self::fallback($today);

        $lines = array();
        foreach (array_values($rows) as $k => $r) {
            $price = round((float)($r['buyprice'] ?? 0), 2);
            $qty = array(10, 5, 2.5, 20)[$k % 4];
            $lines[] = array(
                /* สะกดต่างจากในระบบ: ตัวพิมพ์ / เว้นวรรค / แนบขนาด */
                'name' => self::misspell((string)$r['stname'], $k),
                'code' => null,
                'qty' => $qty,
                'unit' => $r['unit'],
                'unit_price' => $price > 0 ? $price : null,
                'amount' => $price > 0 ? round($price * $qty, 2) : null,
                'discount' => null,
                'lot_no' => null,
                'mfg_date' => null,
                'exp_date' => null,
                'confidence' => $k === 2 ? 'medium' : 'high',
            );
        }
        /* แถวที่ไม่มีในทะเบียนสินค้า — ต้องขึ้นเตือนให้ผู้ใช้เห็น */
        $lines[] = array(
            'name' => 'ค่าขนส่ง (ตัวอย่างแถวที่ไม่มีในทะเบียนสินค้า)', 'code' => null, 'qty' => 1, 'unit' => 'เที่ยว',
            'unit_price' => 150, 'amount' => 150, 'discount' => null,
            'lot_no' => null, 'mfg_date' => null, 'exp_date' => null, 'confidence' => 'high',
        );

        return array(
            'document_type' => 'delivery_note',
            'supplier' => array(
                'name' => 'บริษัท ' . trim((string)$sup['supname']) . ' จำกัด',
                'tax_id' => AiText::digits($sup['taxnumber'] ?? '') ?: null,
                'branch' => 'สำนักงานใหญ่',
                'phone' => null,
            ),
            'document_no' => 'IV-MOCK-' . $today->format('ymd'),
            'document_date' => $today->format('Y-m-d'),
            'po_reference' => null,
            'lines' => $lines,
            'subtotal' => null,
            'vat' => null,
            'grand_total' => null,
            'notes' => 'ข้อมูลจำลอง (AI_MOCK=1) — สร้างจากผู้ขายและสินค้าในระบบ ไม่ได้อ่านจากรูปจริง',
        );
    }

    private static function misspell(string $name, int $k): string
    {
        switch ($k % 3) {
            case 0:
                return mb_strtoupper($name, 'UTF-8');
            case 1:
                return preg_replace('/\s+/u', '', $name) . ' (1 ลัง)';
            default:
                return '  ' . $name . ' ';
        }
    }

    private static function fallback(DateTimeImmutable $today): array
    {
        return array(
            'document_type' => 'delivery_note',
            'supplier' => array('name' => 'ร้านตัวอย่างของแห้ง', 'tax_id' => null, 'branch' => null, 'phone' => null),
            'document_no' => 'IV-MOCK-' . $today->format('ymd'),
            'document_date' => $today->format('Y-m-d'),
            'po_reference' => null,
            'lines' => array(array(
                'name' => 'วุ้นเส้น 500 กรัม', 'code' => null, 'qty' => 10, 'unit' => 'ห่อ',
                'unit_price' => null, 'amount' => null, 'discount' => null,
                'lot_no' => null, 'mfg_date' => null, 'exp_date' => null, 'confidence' => 'high',
            )),
            'subtotal' => null, 'vat' => null, 'grand_total' => null,
            'notes' => 'ข้อมูลจำลอง — ยังไม่มีผู้ขายหรือสินค้าในระบบ',
        );
    }
}
