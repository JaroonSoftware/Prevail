<?php
/* ============================================================================
   จับคู่ข้อมูลในใบส่งของ/บิล กับข้อมูลใน Prevail

   ผู้ขาย  : เลขผู้เสียภาษีตรงกัน > ชื่อที่ระบบเคยจำไว้ > ชื่อคล้ายกัน
   รายการ  : จับคู่กับทะเบียนสินค้า (items ที่เปิดใช้งาน)
             ชื่อที่ระบบเคยจำไว้ > รหัสสินค้าตรงกัน > ชื่อคล้ายกัน (ชื่อไทย / อังกฤษ)
             สินค้าที่ผูกกับผู้ขายรายนี้ (supplier_items) ได้สิทธิ์ก่อนเมื่อคะแนนใกล้กัน
   ============================================================================ */

final class ItemMatcher
{
    public const HIGH = 0.80;      // จับคู่ให้เลย
    public const MEDIUM = 0.55;    // จับคู่ให้ แต่ไฮไลต์ให้ตรวจ
    public const SUP_BONUS = 0.03; // ใช้จัดอันดับเท่านั้น ไม่บวกในคะแนนที่แสดง

    private PDO $conn;
    private ?array $catalog = null;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    /* ---------------------------------------------------------------- ผู้ขาย */

    /** แถวผู้ขายรูปแบบเดียวกับ api/common/options-supplier.php (ฟอร์มใบสั่งซื้อใช้รูปแบบนี้) */
    public function supplierByCode(string $supcode): ?array
    {
        $st = $this->conn->prepare("
            SELECT `supcode`, `supname`, `prename`, `idno`, `road`, `subdistrict`, `district`, `province`,
                   `zipcode`, `tel`, `contact`, `fax`, `taxnumber`, `email`
            FROM `supplier` WHERE supcode = :c LIMIT 1");
        $st->execute(array('c' => $supcode));
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function matchSupplier(array $docSupplier): array
    {
        $rows = $this->conn->query(
            "SELECT supcode, supname, taxnumber FROM `supplier` WHERE active_status = 'Y'"
        )->fetchAll(PDO::FETCH_ASSOC);

        $name = $docSupplier['name'] ?? null;
        $tax = AiText::digits($docSupplier['tax_id'] ?? null);

        /* 1) เลขผู้เสียภาษีตรงกัน */
        if (strlen($tax) >= 10) {
            foreach ($rows as $r) {
                if (AiText::digits($r['taxnumber'] ?? '') === $tax) {
                    return $this->supplierResult($r['supcode'], 1.0, 'tax_id', array());
                }
            }
        }

        /* 2) ชื่อที่ผู้ใช้เคยยืนยันไว้ */
        $norm = AiText::normCompany($name);
        if ($norm !== '') {
            $st = $this->conn->prepare("SELECT supcode FROM `ai_supplier_alias` WHERE raw_hash = :h LIMIT 1");
            $st->execute(array('h' => sha1($norm)));
            $alias = $st->fetchColumn();
            if ($alias && $this->supplierByCode((string)$alias)) {
                return $this->supplierResult((string)$alias, 1.0, 'alias', array());
            }
        }

        /* 3) ชื่อคล้ายกัน */
        $cands = array();
        if ($norm !== '') {
            foreach ($rows as $r) {
                $score = AiText::similarity($norm, AiText::normCompany($r['supname'] ?? ''));
                if ($score >= 0.30) {
                    $cands[] = array('supcode' => $r['supcode'], 'supname' => $r['supname'], 'taxnumber' => $r['taxnumber'], 'score' => $score);
                }
            }
            usort($cands, function ($a, $b) { return $b['score'] <=> $a['score']; });
            $cands = array_slice($cands, 0, 5);
        }

        /* ต้องชนะอันดับสองขาดพอสมควร ไม่งั้นให้ผู้ใช้เลือกเอง ดีกว่าเดาผิด */
        $top = $cands[0]['score'] ?? 0;
        $second = $cands[1]['score'] ?? 0;
        if ($top >= 0.98 || ($top >= 0.60 && $top - $second >= 0.08)) {
            return $this->supplierResult($cands[0]['supcode'], $top, 'name', $cands);
        }
        return array('supplier' => null, 'score' => $top, 'source' => 'none', 'candidates' => $cands);
    }

    private function supplierResult(string $supcode, float $score, string $source, array $cands): array
    {
        return array('supplier' => $this->supplierByCode($supcode), 'score' => $score, 'source' => $source, 'candidates' => $cands);
    }

    /* ---------------------------------------------------------- ทะเบียนสินค้า */

    /** สินค้าที่เปิดใช้งาน เรียงตาม seq เหมือนหน้าเลือกสินค้า (ไม่ซ้ำ stcode) */
    public function catalog(): array
    {
        if ($this->catalog !== null) return $this->catalog;

        /* เช็กก่อน: ฐานข้อมูลบางที่ยังไม่มี stnameEN หรือยังไม่ได้รัน SQL
           ตารางชื่อย่อย (sql/2026-10-30_items_add_alias.sql) ก็ยังทำงานได้ */
        $hasEn = $this->hasColumn('items', 'stnameEN');
        $cols = "i.stcode, i.stname, " . ($hasEn ? "i.stnameEN" : "NULL AS stnameEN");

        /* ชื่อย่อยทั้งหมด ดึงครั้งเดียวแล้วจัดกลุ่มตามรหัสสินค้า */
        $aliasMap = array();
        if ($this->conn->query("SHOW TABLES LIKE 'items_alias'")->fetch()) {
            $ar = $this->conn->query("SELECT stcode, alias_name FROM items_alias ORDER BY stcode, seq, alias_id")
                ->fetchAll(PDO::FETCH_ASSOC);
            foreach ($ar as $a) $aliasMap[(string)$a['stcode']][] = (string)$a['alias_name'];
        }
        $rows = $this->conn->query(
            "SELECT $cols, i.unit, i.buyprice, i.vat, t.typename
             FROM items i LEFT OUTER JOIN itemtype t ON i.typecode = t.typecode
             WHERE i.active_status = 'Y' ORDER BY i.seq, i.stcode"
        )->fetchAll(PDO::FETCH_ASSOC);

        $out = array();
        foreach ($rows as $r) {
            $code = (string)$r['stcode'];
            if ($code === '' || isset($out[$code])) continue;

            /* ชื่อย่อยที่กรอกไว้ ตัดช่องว่าง ตัดซ้ำ */
            $aliases = array();
            foreach (($aliasMap[$code] ?? array()) as $a) {
                $a = trim($a);
                if ($a !== '' && !in_array($a, $aliases, true)) $aliases[] = $a;
            }

            $out[$code] = array(
                'stcode' => $code,
                'stname' => (string)$r['stname'],
                'stnameEN' => $r['stnameEN'] !== null && trim((string)$r['stnameEN']) !== '' ? trim((string)$r['stnameEN']) : null,
                'aliases' => $aliases,
                'unit' => $r['unit'],
                'buyprice' => (float)($r['buyprice'] ?? 0),
                'vat' => (float)($r['vat'] ?? 0),
                'typename' => $r['typename'],
            );
        }
        return $this->catalog = array_values($out);
    }

    private function hasColumn(string $table, string $column): bool
    {
        $st = $this->conn->prepare("SHOW COLUMNS FROM `$table` LIKE :c");
        $st->execute(array('c' => $column));
        return (bool)$st->fetch();
    }

    /** รหัสสินค้าที่ผูกกับผู้ขายรายนี้ (ข้อมูลผู้ขาย > รายการสินค้า) */
    public function supplierItems(?string $supcode): array
    {
        if ($supcode === null || $supcode === '') return array();
        $st = $this->conn->prepare("SELECT stcode FROM supplier_items WHERE supcode = :s");
        $st->execute(array('s' => $supcode));
        return array_fill_keys(array_map('strval', $st->fetchAll(PDO::FETCH_COLUMN)), true);
    }

    /* ------------------------------------------------------------- จับคู่รายการ */

    /**
     * คืน array(
     *   'lines' => [ {index, doc, match:{code(stcode), score, level, source, candidates[]}} ],
     *   'items' => ทะเบียนสินค้า (มี sup = 1 ถ้าผูกกับผู้ขายนี้) ใช้เป็นตัวเลือกในหน้าเว็บ
     * )
     */
    public function matchLines(?string $supcode, array $docLines): array
    {
        $catalog = $this->catalog();
        $supItems = $this->supplierItems($supcode);

        $aliases = array();
        $st = $this->conn->prepare("SELECT raw_hash, stcode FROM `ai_item_alias` WHERE supcode = :s");
        $st->execute(array('s' => (string)$supcode));
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $a) $aliases[$a['raw_hash']] = (string)$a['stcode'];

        /* เตรียมข้อมูลชื่อสินค้าไว้ครั้งเดียว — ทะเบียนสินค้ามีได้หลายพันรายการ */
        $profiles = array();
        $byCode = array();
        foreach ($catalog as $idx => $it) {
            $ps = array();
            /* เทียบกับชื่อไทย ชื่ออังกฤษ และชื่อย่อยทุกชื่อ แล้วเอาคะแนนสูงสุด */
            foreach (array_merge(array($it['stname'], $it['stnameEN']), $it['aliases']) as $n) {
                $nn = AiText::norm($n);
                if ($nn !== '') $ps[] = AiText::profile($nn);
            }
            $profiles[$idx] = $ps;
            $byCode[AiText::norm($it['stcode'])] = $idx;
        }

        $lines = array();
        foreach (array_values($docLines) as $i => $line) {
            $rawNorm = AiText::norm($line['name'] ?? '');
            $rawP = AiText::profile($rawNorm);
            $codeNorm = AiText::norm($line['code'] ?? '');
            $aliasSt = $rawNorm !== '' ? ($aliases[sha1($rawNorm)] ?? null) : null;
            $codeIdx = $codeNorm !== '' ? ($byCode[$codeNorm] ?? null) : null;

            $scored = array();
            foreach ($catalog as $idx => $it) {
                $score = 0.0;
                $source = 'name';
                if ($rawNorm !== '') {
                    foreach ($profiles[$idx] as $p) $score = max($score, AiText::similarityP($rawP, $p));
                }
                if ($codeIdx === $idx) {
                    $score = max($score, 0.98);
                    $source = 'code';
                }
                if ($aliasSt !== null && $aliasSt === $it['stcode']) {
                    $score = 1.0;
                    $source = 'alias';
                }
                if ($score < 0.30) continue;
                $sup = isset($supItems[$it['stcode']]) ? 1 : 0;
                $scored[] = array(
                    'code' => $it['stcode'], 'score' => round($score, 4), 'source' => $source, 'idx' => $idx,
                    'sup' => $sup, 'rank' => $score + ($sup && $score < 1.0 ? self::SUP_BONUS : 0),
                );
            }
            /* สินค้าของผู้ขายรายนี้ได้ก่อนเมื่อคะแนนใกล้กัน แล้วค่อยตามลำดับในทะเบียน */
            usort($scored, function ($a, $b) {
                return ($b['rank'] <=> $a['rank']) ?: ($a['idx'] <=> $b['idx']);
            });

            $best = $scored[0] ?? null;
            $chosen = ($best && $best['score'] >= self::MEDIUM) ? $best : null;

            /* อันดับสองคะแนนใกล้กันมาก -> ไม่ฟันธง ให้ผู้ใช้ตรวจ */
            $ambiguous = false;
            if ($chosen && $chosen['score'] < 1.0 && isset($scored[1])) {
                $ambiguous = ($chosen['rank'] - $scored[1]['rank']) < 0.05;
            }

            $lines[] = array(
                'index' => $i,
                'doc' => $line,
                'match' => array(
                    'code' => $chosen['code'] ?? null,
                    'score' => $best['score'] ?? 0,
                    'level' => !$chosen ? 'low' : (($chosen['score'] >= self::HIGH && !$ambiguous) ? 'high' : 'medium'),
                    'source' => $chosen['source'] ?? null,
                    'candidates' => array_map(function ($c) {
                        return array('code' => $c['code'], 'score' => $c['score']);
                    }, array_slice($scored, 0, 8)),
                ),
            );
        }

        $items = array();
        foreach ($catalog as $it) {
            $it['sup'] = isset($supItems[$it['stcode']]) ? 1 : 0;
            $items[] = $it;
        }
        return array('lines' => $lines, 'items' => $items);
    }

    /**
     * รายการสินค้าที่ส่งให้ AI ช่วยเลือก: สินค้าของผู้ขายรายนี้ + ผู้สมัครอันดับต้นของแต่ละแถว
     * จำกัดจำนวนไว้ ไม่ส่งทั้งทะเบียน (ประหยัดค่า AI)
     */
    public function semanticPool(array $result, array $which, int $max = 300): array
    {
        $want = array();
        foreach ($which as $i) {
            foreach (($result['lines'][$i]['match']['candidates'] ?? array()) as $c) $want[$c['code']] = true;
        }
        foreach ($result['items'] as $it) {
            if (count($want) >= $max) break;
            if (!empty($it['sup'])) $want[$it['stcode']] = true;
        }
        $pool = array();
        foreach ($result['items'] as $it) {
            if (!isset($want[$it['stcode']])) continue;
            $pool[] = array(
                'code' => $it['stcode'],
                'name' => $it['stname'] . ($it['stnameEN'] ? ' / ' . $it['stnameEN'] : ''),
                /* ชื่อเรียกอื่นที่ผู้ใช้กรอกไว้ ให้ AI เห็นด้วยตอนช่วยจับคู่ */
                'aka' => $it['aliases'],
                'unit' => $it['unit'],
                'type' => $it['typename'],
            );
            if (count($pool) >= $max) break;
        }
        return $pool;
    }

    /** ใช้ผลจาก AI ช่วยจับคู่ กับแถวที่ระบบเองยังไม่มั่นใจ */
    public function applySemantic(array $lines, array $matches, array $pool): array
    {
        $codes = array_flip(array_map('strval', array_column($pool, 'code')));
        foreach ($matches as $m) {
            $i = $m['i'] ?? null;
            $code = isset($m['code']) ? (string)$m['code'] : null;
            $conf = $m['confidence'] ?? 'low';
            if (!is_int($i) || !isset($lines[$i]) || $code === null || !isset($codes[$code])) continue;
            if ($lines[$i]['match']['level'] === 'high') continue;
            if ($conf === 'low') continue;

            $score = $conf === 'high' ? max(0.85, $lines[$i]['match']['score']) : max(0.70, $lines[$i]['match']['score']);
            $lines[$i]['match']['code'] = $code;
            $lines[$i]['match']['score'] = round($score, 4);
            $lines[$i]['match']['level'] = $score >= self::HIGH ? 'high' : 'medium';
            $lines[$i]['match']['source'] = 'ai';
            $lines[$i]['match']['reason'] = AiText::str($m['reason'] ?? null, 200);
        }
        return $lines;
    }
}
