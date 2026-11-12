<?php
require_once dirname(__DIR__, 2) . "/common/packing.php";
/* ============================================================================
   สร้าง "ร่างใบขายสินค้า" (somaster.doc_status = 'รอยืนยันใบขายสินค้า') จาก PO ที่ AI อ่านแล้ว

   - 1 order ใน PO (เลขที่ PO + ครัว/จุดส่ง + วันส่ง) = ใบขายสินค้า 1 ใบ
   - รายการที่จับคู่สินค้าได้มั่นใจ + หน่วยตรงกัน -> ลง sodetail เลย
     ราคา: ราคาในแคตตาล็อกของลูกค้า > ราคาที่พิมพ์ใน PO > 0
   - รายการที่ไม่มั่นใจ / หน่วยไม่ตรง (เช่น ขีด, Pack 800 G) / ไม่มีจำนวน
     -> ai_so_pending ให้ผู้ใช้จับคู่เองในหน้าใบขายสินค้า
   - ใบขายสินค้าสถานะ "รอยืนยันใบขายสินค้า" ไม่โผล่ในใบจัดสินค้า/ใบส่งของ/รายงานเตรียมของ
     จนกว่าผู้ใช้กดยืนยัน (api/ai/so-confirm.php)
   ============================================================================ */

final class SoDraft
{
    public const STATUS_DRAFT = 'รอยืนยันใบขายสินค้า';
    public const STATUS_READY = 'รอออกใบส่งของ';

    public static function requireDraftStatus(PDO $conn): void
    {
        $column = $conn->query("SHOW COLUMNS FROM somaster LIKE 'doc_status'")->fetch(PDO::FETCH_ASSOC);
        if (!$column) throw new AiUserException('ไม่พบคอลัมน์ somaster.doc_status กรุณาตรวจโครงสร้างฐานข้อมูล');
        $type = (string)$column['Type'];
        if (stripos($type, 'enum(') === 0 && strpos($type, "'" . self::STATUS_DRAFT . "'") === false) {
            throw new AiUserException('somaster.doc_status ยังไม่รองรับสถานะรอยืนยัน กรุณาปรับโครงสร้างด้วยไฟล์ SQL ที่ตรวจแล้วก่อนนำเข้า');
        }
    }

    /** คีย์ที่ใช้เก็บชื่อที่เคยจับคู่ใน ai_item_alias (ตารางเดียวกับฝั่งผู้ขาย แยกด้วย prefix) */
    public static function aliasKey(string $cuscode): string
    {
        return 'CUS:' . $cuscode;
    }

    /** มีคอลัมน์เก็บข้อความจาก PO ใน sodetail หรือยัง (sql/2026-11-12_sodetail_ai_source.sql) */
    public static function hasSourceCols(PDO $conn): bool
    {
        static $has = null;
        if ($has === null) $has = (bool)$conn->query("SHOW COLUMNS FROM sodetail LIKE 'ai_raw_code'")->fetch();
        return $has;
    }

    /** hash ของรหัสสินค้าลูกค้า (แยกจาก hash ของชื่อด้วย prefix) */
    public static function codeHash(string $codeNorm): string
    {
        return sha1('#code:' . $codeNorm);
    }

    /**
     * จำว่า ชื่อ (และรหัสสินค้าของลูกค้า) ใน PO ของลูกค้ารายนี้ = สินค้า $stcode ของเรา
     * ครั้งหน้า AI จับคู่ให้เองด้วยคะแนน 100%
     */
    public static function rememberItem(PDO $conn, string $cuscode, ?string $rawName, ?string $rawCode, string $stcode, $user): void
    {
        if ($cuscode === '' || $stcode === '') return;
        $ins = $conn->prepare("
            INSERT INTO ai_item_alias (supcode, raw_text, raw_norm, raw_hash, stcode, created_by)
            VALUES (:s, :t, :n, :h, :c, :u)
            ON DUPLICATE KEY UPDATE stcode = VALUES(stcode), raw_text = VALUES(raw_text), hit_count = hit_count + 1");
        $key = self::aliasKey($cuscode);
        $norm = AiText::norm($rawName);
        if ($norm !== '') {
            $ins->execute(array('s' => $key, 't' => mb_substr((string)$rawName, 0, 160, 'UTF-8'), 'n' => mb_substr($norm, 0, 160, 'UTF-8'),
                'h' => sha1($norm), 'c' => $stcode, 'u' => $user));
        }
        $cn = AiText::norm($rawCode);
        if ($cn !== '') {
            $ins->execute(array('s' => $key, 't' => mb_substr('รหัสลูกค้า: ' . $rawCode, 0, 160, 'UTF-8'), 'n' => mb_substr('#code:' . $cn, 0, 160, 'UTF-8'),
                'h' => self::codeHash($cn), 'c' => $stcode, 'u' => $user));
        }
    }

    /* ------------------------------------------------------------- ลูกค้า */

    public static function customerByCode(PDO $conn, string $cuscode): ?array
    {
        $st = $conn->prepare("SELECT cuscode, prename, cusname, taxnumber FROM customer WHERE cuscode = :c LIMIT 1");
        $st->execute(array('c' => $cuscode));
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /** เลขผู้เสียภาษี > ชื่อที่เคยจำ > ชื่อคล้าย (ไทย/อังกฤษ) */
    public static function matchCustomer(PDO $conn, array $docCus): array
    {
        $hasEn = (bool)$conn->query("SHOW COLUMNS FROM customer LIKE 'cusname_en'")->fetch();
        $rows = $conn->query("SELECT cuscode, prename, cusname, taxnumber" . ($hasEn ? ", cusname_en" : ", NULL cusname_en")
            . " FROM customer WHERE active_status = 'Y'")->fetchAll(PDO::FETCH_ASSOC);

        $tax = AiText::digits($docCus['tax_id'] ?? null);
        if (strlen($tax) >= 10) {
            $hits = array_values(array_filter($rows, function ($r) use ($tax) {
                return AiText::digits($r['taxnumber'] ?? '') === $tax;
            }));
            /* เครือโรงแรมเดียวกันใช้เลขผู้เสียภาษีเดียวกันหลายสาขาได้ -> ฟันธงเฉพาะเมื่อเจอรายเดียว */
            if (count($hits) === 1) return array('customer' => $hits[0], 'score' => 1.0, 'source' => 'tax_id', 'candidates' => array());
        }

        $norm = AiText::normCompany($docCus['name'] ?? null);
        $variants = self::nameVariants($docCus['name'] ?? null);
        foreach ($variants as $v) {
            $st = $conn->prepare("SELECT cuscode FROM ai_customer_alias WHERE raw_hash = :h LIMIT 1");
            $st->execute(array('h' => sha1($v)));
            $code = $st->fetchColumn();
            if ($code && ($c = self::customerByCode($conn, (string)$code))) {
                return array('customer' => $c, 'score' => 1.0, 'source' => 'alias', 'candidates' => array());
            }
        }

        $cands = array();
        if ($variants) {
            foreach ($rows as $r) {
                $score = 0.0;
                foreach (array($r['cusname'] ?? '', $r['cusname_en'] ?? '') as $cn) {
                    $cnorm = AiText::normCompany($cn);
                    if ($cnorm === '') continue;
                    foreach ($variants as $v) {
                        $score = max($score, AiText::similarity($v, $cnorm));
                        /* ชื่อในระบบอยู่ในชื่อบน PO (หรือกลับกัน) เช่น "Angsana Laguna" กับ
                           "Bangtao Grande Co.,Ltd. (Angsana Laguna Phuket)" */
                        $short = mb_strlen($cnorm) <= mb_strlen($v) ? $cnorm : $v;
                        $long = $short === $cnorm ? $v : $cnorm;
                        if (mb_strlen($short) >= 6 && mb_strpos($long, $short) !== false) $score = max($score, 0.9);
                    }
                }
                if ($score >= 0.30) $cands[] = array('cuscode' => $r['cuscode'], 'cusname' => trim(($r['prename'] ?? '') . ' ' . $r['cusname']), 'score' => round($score, 3));
            }
            usort($cands, function ($a, $b) { return $b['score'] <=> $a['score']; });
            $cands = array_slice($cands, 0, 8);
        }
        $top = $cands[0]['score'] ?? 0;
        $second = $cands[1]['score'] ?? 0;
        if ($top >= 0.98 || ($top >= 0.70 && $top - $second >= 0.10)) {
            return array('customer' => self::customerByCode($conn, $cands[0]['cuscode']), 'score' => $top, 'source' => 'name', 'candidates' => $cands);
        }
        return array('customer' => null, 'score' => $top, 'source' => 'none', 'candidates' => $cands);
    }

    /** ชื่อบน PO มักเป็น "นิติบุคคล (ชื่อโรงแรม)" -> เทียบทั้งชื่อเต็ม ส่วนนอกวงเล็บ และในวงเล็บ */
    private static function nameVariants(?string $name): array
    {
        $out = array();
        $name = (string)$name;
        $add = function ($s) use (&$out) {
            $n = AiText::normCompany($s);
            if (mb_strlen($n) >= 3 && !in_array($n, $out, true)) $out[] = $n;
        };
        $add($name);
        $add(preg_replace('/[\(\[].*?[\)\]]/u', ' ', $name));
        if (preg_match_all('/[\(\[](.*?)[\)\]]/u', $name, $m)) foreach ($m[1] as $in) $add($in);
        return $out;
    }

    public static function rememberCustomer(PDO $conn, ?string $rawName, string $cuscode, ?string $user): void
    {
        $raw = AiText::str($rawName, 160);
        $norm = AiText::normCompany($raw);
        if ($norm === '') return;
        $st = $conn->prepare("
            INSERT INTO ai_customer_alias (raw_text, raw_norm, raw_hash, cuscode, created_by)
            VALUES (:t, :n, :h, :c, :u)
            ON DUPLICATE KEY UPDATE cuscode = VALUES(cuscode), raw_text = VALUES(raw_text), hit_count = hit_count + 1");
        $st->execute(array('t' => $raw, 'n' => mb_substr($norm, 0, 160, 'UTF-8'), 'h' => sha1($norm), 'c' => $cuscode, 'u' => $user));
    }

    /** ราคาสินค้าตามแคตตาล็อกที่ผูกกับลูกค้า (เหมือน options-items.php?p=cl) */
    public static function catalogPrices(PDO $conn, string $cuscode): array
    {
        $st = $conn->prepare("
            SELECT d.stcode, d.price, i.unit, i.vat
            FROM catalog_link a
            JOIN catalog_detail d ON a.catalog_code = d.catalog_code
            JOIN catalog_master m ON a.catalog_code = m.catalog_code
            JOIN items i ON d.stcode = i.stcode
            WHERE a.cuscode = :c AND (CURDATE() BETWEEN m.start_date AND m.stop_date) AND m.active_status = 'Y' ORDER BY m.start_date DESC, a.catalog_code DESC");
        $st->execute(array('c' => $cuscode));
        $out = array();
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            if (isset($out[(string)$r['stcode']])) continue;
            $out[(string)$r['stcode']] = array('price' => (float)$r['price'], 'unit' => $r['unit'], 'vat' => (int)($r['vat'] ?? 0));
        }
        return $out;
    }

    /* --------------------------------------------------------- สร้างใบขาย */

    /**
     * สร้างร่างใบขายสินค้าจากทุก order ใน $doc  (ต้องอยู่ใน transaction ของผู้เรียก)
     * คืน [ {socode, customer_po, del_room, deldate, lines, auto, pending} ]
     */
    public static function create(PDO $conn, ItemMatcher $matcher, UsageLog $log, array $doc, string $cuscode,
                                  int $importId, ?string $user, bool $mock, string $fileName): array
    {
        // Reject incompatible schema before an ENUM silently stores an empty status.
        self::requireDraftStatus($conn);
        $packingReady = packing_schema_ready($conn);
        $catalog = self::catalogPrices($conn, $cuscode);
        $items = array();
        foreach ($matcher->catalog() as $it) $items[$it['stcode']] = $it;

        /* จับคู่ทุกบรรทัดของทุก order ในครั้งเดียว (AI ช่วยจับคู่เรียกครั้งเดียว ประหยัดกว่า) */
        $flat = array();
        $owner = array();
        foreach ($doc['orders'] as $oi => $o) {
            foreach ($o['lines'] as $li => $l) {
                $flat[] = $l;
                $owner[] = array($oi, $li);
            }
        }
        $matched = ai_match_lines($conn, $matcher, $log, self::aliasKey($cuscode), array('lines' => $flat), null, $mock);
        $byOrder = array();
        // Keep every source row even if matching returns no result.
        foreach ($flat as $k => $line) {
            $m = $matched['lines'][$k] ?? array('doc' => $line, 'match' => array('code' => null, 'level' => 'low', 'candidates' => array()));
            list($oi, $li) = $owner[$k];
            $byOrder[$oi][$li] = self::decide($m, $catalog, $items);
        }

        // AI matching is complete; do not hold the numbering lock during external calls.
        lock_document_numbers($conn);
        $insHead = $conn->prepare("
            INSERT INTO somaster (socode, cuscode, sodate, customer_po, del_room, total_price, deldate, remark,
                                  active_status, doc_status, created_date, created_by)
            VALUES (:socode, :cuscode, :sodate, :po, :room, :total, :deldate, :remark, 'Y', :status, :now, :user)");
        $srcCols = self::hasSourceCols($conn);
        $insLine = $conn->prepare("
            INSERT INTO sodetail (socode, stcode, qty, price, unit, vat, total_cost" . ($packingReady ? ", packing_weight" : "") . ($srcCols ? ", ai_raw, ai_raw_code, ai_stcode" : "") . ")
            VALUES (:socode, :stcode, :qty, :price, :unit, :vat, 0" . ($packingReady ? ", :packing_weight" : "") . ($srcCols ? ", :ai_raw, :ai_raw_code, :ai_stcode" : "") . ")");
        $insPend = $conn->prepare("
            INSERT INTO ai_so_pending (socode, import_id, seq, raw_name, raw_code, qty, unit, price, suggest_stcode, confidence)
            VALUES (:socode, :imp, :seq, :name, :code, :qty, :unit, :price, :sug, :conf)");

        $now = date('Y-m-d H:i:s');
        $out = array();
        foreach ($doc['orders'] as $oi => $o) {
            $socode = self::nextSocode($conn);
            $decided = $byOrder[$oi] ?? array();

            $total = 0.0;
            foreach ($decided as $d) {
                if ($d['auto']) $total += $d['qty'] * $d['price'] * (1 + $d['vat'] / 100);
            }
            $remark = 'สร้างจาก PO ด้วย AI' . ($fileName !== '' ? " ($fileName)" : '');
            if (!empty($doc['notes'])) $remark .= ' — ' . $doc['notes'];

            $insHead->execute(array(
                'socode' => $socode, 'cuscode' => $cuscode,
                /* วันที่ใบขาย = วันที่นัดส่งจาก PO (ถ้าไม่มี ใช้วันที่สั่ง แล้วค่อยใช้วันนี้) */
                'sodate' => $o['delivery_date'] ?: ($o['order_date'] ?: date('Y-m-d')),
                'po' => $o['po_no'], 'room' => $o['location'],
                'total' => round($total, 2),
                'deldate' => $o['delivery_date'] ?: ($o['order_date'] ?: date('Y-m-d')),
                'remark' => mb_substr($remark, 0, 250, 'UTF-8'),
                'status' => self::STATUS_DRAFT, 'now' => $now, 'user' => $user,
            ));
            $savedStatus = $conn->prepare("SELECT doc_status FROM somaster WHERE socode = :s");
            $savedStatus->execute(array('s' => $socode));
            if ($savedStatus->fetchColumn() !== self::STATUS_DRAFT) {
                throw new AiUserException('บันทึกสถานะรอยืนยันไม่สำเร็จ ระบบยกเลิกการนำเข้าครั้งนี้ กรุณาตรวจโครงสร้าง doc_status');
            }

            $nAuto = 0;
            $nPend = 0;
            foreach ($decided as $li => $d) {
                if ($d['auto']) {
                    /* ใช้ array_merge แทน ...[] — PHP บนโฮสต์ต่ำกว่า 8.1 กระจาย array ที่มี key เป็นข้อความไม่ได้
                       ("Cannot unpack array with string keys") */
                    $insLine->execute(array_merge(array(
                        'socode' => $socode, 'stcode' => $d['stcode'], 'qty' => $d['qty'],
                        'price' => $d['price'], 'unit' => $d['unit'], 'vat' => $d['vat'],
                    ), $packingReady ? array('packing_weight' => packing_resolve($conn, $cuscode, $d)) : array(),
                       $srcCols ? array('ai_raw' => mb_substr((string)$o['lines'][$li]['name'], 0, 500, 'UTF-8'),
                                        'ai_raw_code' => $o['lines'][$li]['code'] !== null ? mb_substr((string)$o['lines'][$li]['code'], 0, 100, 'UTF-8') : null,
                                        'ai_stcode' => $d['stcode']) : array()));
                    $nAuto++;
                } else {
                    $l = $o['lines'][$li];
                    $insPend->execute(array(
                        'socode' => $socode, 'imp' => $importId, 'seq' => $li + 1,
                        'name' => mb_substr($l['name'], 0, 500, 'UTF-8'), 'code' => $l['code'],
                        'qty' => $l['qty'], 'unit' => $l['unit'], 'price' => $l['unit_price'],
                        'sug' => $d['stcode'], 'conf' => $l['confidence'],
                    ));
                    $nPend++;
                }
            }

            $out[] = array(
                'socode' => $socode, 'customer_po' => $o['po_no'], 'del_room' => $o['location'],
                'deldate' => $o['delivery_date'], 'lines' => count($o['lines']), 'auto' => $nAuto, 'pending' => $nPend,
                'total_price' => round($total, 2),
            );
        }
        return $out;
    }

    /** ตัดสินแต่ละบรรทัด: ลงใบขายเลย หรือรอผู้ใช้จับคู่ */
    private static function decide(array $m, array $catalog, array $items): array
    {
        $doc = $m['doc'];
        $code = $m['match']['code'] ?? null;
        $level = $m['match']['level'] ?? 'low';

        /* สินค้าที่อยู่ในแคตตาล็อกของลูกค้ารายนี้ได้ก่อน ถ้าคะแนนใกล้กัน */
        if ($code !== null && !isset($catalog[$code])) {
            $best = null;
            foreach (($m['match']['candidates'] ?? array()) as $c) {
                if (isset($catalog[$c['code']]) && $c['score'] >= ($m['match']['score'] - 0.05)) { $best = $c['code']; break; }
            }
            if ($best !== null) $code = $best;
        }

        $item = $code !== null ? ($items[$code] ?? null) : null;
        $unit = $catalog[$code]['unit'] ?? ($item['unit'] ?? $doc['unit']);
        $qty = (float)($doc['qty'] ?? 0);
        $price = $code !== null && isset($catalog[$code]) ? $catalog[$code]['price'] : (float)($doc['unit_price'] ?? 0);
        $vat = $code !== null && isset($catalog[$code]) ? $catalog[$code]['vat'] : (int)($item['vat'] ?? 0);

        $auto = $code !== null && $item !== null
            && $level === 'high'
            && ($doc['confidence'] ?? 'medium') !== 'low'
            && $qty > 0
            && AiText::sameUnit($doc['unit'] ?? null, $unit);

        /* ไม่มั่นใจก็ยังเสนออันดับหนึ่งไว้ให้ผู้ใช้เป็นค่าเริ่มต้น */
        if ($code === null) $code = $m['match']['candidates'][0]['code'] ?? null;

        return array('auto' => $auto, 'stcode' => $code, 'qty' => $qty, 'unit' => $unit, 'price' => $price, 'vat' => $vat);
    }

    /** เลขที่ใบขายถัดไป (request_socode คืน 0 ครั้งแรกของเดือนตอนเพิ่งสร้างแถว options) */
    private static function nextSocode(PDO $conn): string
    {
        $code = document_number($conn, 'socode', true);
        return (string)$code;
    }
}
