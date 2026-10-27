<?php
/* ============================================================================
   เครื่องมือเทียบข้อความภาษาไทย/อังกฤษ สำหรับจับคู่ชื่อในใบส่งของกับข้อมูลในระบบ

   ภาษาไทยไม่เว้นวรรคระหว่างคำ การเทียบแบบตัดคำจึงไม่แม่น
   ใช้วิธีตัดเป็นชิ้นละ 2-3 ตัวอักษร (n-gram) แล้วนับว่าซ้ำกันกี่ชิ้น (Dice)
   ============================================================================ */

final class AiText
{
    private const THAI_DIGITS = array(
        '๐' => '0', '๑' => '1', '๒' => '2', '๓' => '3', '๔' => '4',
        '๕' => '5', '๖' => '6', '๗' => '7', '๘' => '8', '๙' => '9',
    );

    /** คำนำหน้า/ท้ายชื่อบริษัทที่ไม่ช่วยแยกผู้ขาย */
    private const COMPANY_NOISE = array(
        'ห้างหุ้นส่วนจำกัด', 'ห้างหุ้นส่วนสามัญ', 'บริษัท', 'บจก.', 'บจก', 'หจก.', 'หจก',
        '(มหาชน)', 'มหาชน', 'จำกัด', 'สำนักงานใหญ่', 'สาขาที่', 'สาขา', '(ประเทศไทย)', 'ประเทศไทย',
        'co.,ltd.', 'co.,ltd', 'co., ltd.', 'co., ltd', 'co.ltd', 'company', 'limited', 'ltd.', 'ltd',
        'corporation', 'corp.', 'inc.', 'public', 'pcl.', 'pcl', 'plc', '(thailand)', 'thailand',
        'part.,ltd.', 'part., ltd.', 'limited partnership',
    );

    /** ตัวสะกดหน่วยที่พบบ่อย -> หน่วยกลาง */
    private const UNITS = array(
        'kg' => array('kg', 'kgs', 'กก', 'กิโลกรัม', 'กิโล', 'kilogram', 'kilograms'),
        'g' => array('g', 'gm', 'gram', 'grams', 'กรัม', 'ก'),
        'ton' => array('ton', 'tons', 'ตัน', 'mt'),
        'l' => array('l', 'lt', 'ltr', 'litre', 'liter', 'ลิตร', 'ล'),
        'ml' => array('ml', 'มล', 'มิลลิลิตร', 'cc', 'ซีซี'),
        'bag' => array('bag', 'bags', 'ถุง', 'กระสอบ', 'sack', 'sacks'),
        'box' => array('box', 'boxes', 'กล่อง'),
        'carton' => array('carton', 'cartons', 'ctn', 'ctns', 'ลัง'),
        'bottle' => array('bottle', 'bottles', 'btl', 'ขวด'),
        'can' => array('can', 'cans', 'กระป๋อง'),
        'drum' => array('drum', 'drums', 'ถัง', 'แกลลอน', 'gallon', 'pail', 'pails'),
        'pcs' => array('pc', 'pcs', 'piece', 'pieces', 'ea', 'each', 'ชิ้น', 'อัน', 'unit', 'units'),
        'roll' => array('roll', 'rolls', 'ม้วน'),
        'pack' => array('pack', 'packs', 'pk', 'แพ็ค', 'แพค', 'แพ็ก', 'ห่อ'),
        'set' => array('set', 'sets', 'ชุด'),
        'sheet' => array('sheet', 'sheets', 'แผ่น'),
        'm' => array('m', 'meter', 'metre', 'เมตร'),
    );

    public static function chars(string $s): array
    {
        $out = preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY);
        return is_array($out) ? $out : array();
    }

    public static function len(string $s): int
    {
        return count(self::chars($s));
    }

    /** ตัวพิมพ์เล็ก เลขไทยเป็นเลขอารบิก ตัดช่องว่าง/เครื่องหมายทั้งหมด */
    public static function norm(?string $s): string
    {
        if ($s === null) return '';
        $s = mb_strtolower($s, 'UTF-8');
        $s = strtr($s, self::THAI_DIGITS);
        $s = preg_replace('/[\s\p{P}\p{S}]+/u', '', $s);
        return is_string($s) ? $s : '';
    }

    /** เหมือน norm แต่ตัดคำว่า บริษัท/จำกัด/Co.,Ltd. ออกก่อน */
    public static function normCompany(?string $s): string
    {
        if ($s === null) return '';
        $s = ' ' . mb_strtolower($s, 'UTF-8') . ' ';
        $s = str_replace(self::COMPANY_NOISE, ' ', $s);
        return self::norm($s);
    }

    public static function digits(?string $s): string
    {
        if ($s === null) return '';
        return preg_replace('/\D+/', '', strtr($s, self::THAI_DIGITS)) ?? '';
    }

    private static function grams(array $chars, int $n): array
    {
        $count = count($chars);
        $out = array();
        if ($count < $n) {
            if ($count > 0) $out[implode('', $chars)] = 1;
            return $out;
        }
        for ($i = 0; $i <= $count - $n; $i++) {
            $g = implode('', array_slice($chars, $i, $n));
            $out[$g] = ($out[$g] ?? 0) + 1;
        }
        return $out;
    }

    private static function dice(array $a, array $b): float
    {
        $na = array_sum($a);
        $nb = array_sum($b);
        if ($na + $nb === 0) return 0.0;
        $inter = 0;
        foreach ($a as $g => $c) {
            if (isset($b[$g])) $inter += min($c, $b[$g]);
        }
        return (2.0 * $inter) / ($na + $nb);
    }

    /**
     * ความเหมือนของข้อความที่ normalize แล้ว (0-1)
     * ถ้าข้อความหนึ่งอยู่ในอีกข้อความทั้งก้อน (เช่น "แป้งมัน" กับ "แป้งมันสำปะหลัง") ให้คะแนนสูง
     */
    /**
     * เตรียมข้อมูลของข้อความไว้ล่วงหน้า (ใช้กับทะเบียนสินค้าที่มีหลายพันรายการ)
     * similarityP(profile(a), profile(b)) ให้ผลเท่ากับ similarity(a, b) แต่เร็วกว่ามาก
     */
    public static function profile(string $norm): array
    {
        $c = self::chars($norm);
        return array('s' => $norm, 'n' => count($c), 'g2' => self::grams($c, 2), 'g3' => self::grams($c, 3));
    }

    public static function similarityP(array $a, array $b): float
    {
        if ($a['s'] === '' || $b['s'] === '') return 0.0;
        if ($a['s'] === $b['s']) return 1.0;
        $score = self::dice($a['g2'], $b['g2']);
        if (min($a['n'], $b['n']) >= 6) {
            $score = ($score + self::dice($a['g3'], $b['g3'])) / 2;
        }
        $short = min($a['n'], $b['n']);
        $long = max($a['n'], $b['n']);
        if ($short >= 4 && (strpos($a['s'], $b['s']) !== false || strpos($b['s'], $a['s']) !== false)) {
            $score = max($score, 0.80 + 0.15 * ($short / $long));
        }
        return round(min(1.0, $score), 4);
    }

    public static function similarity(string $a, string $b): float
    {
        if ($a === '' || $b === '') return 0.0;
        if ($a === $b) return 1.0;

        $ca = self::chars($a);
        $cb = self::chars($b);
        $la = count($ca);
        $lb = count($cb);

        $score = self::dice(self::grams($ca, 2), self::grams($cb, 2));
        if (min($la, $lb) >= 6) {
            $tri = self::dice(self::grams($ca, 3), self::grams($cb, 3));
            $score = ($score + $tri) / 2;
        }

        $short = min($la, $lb);
        $long = max($la, $lb);
        if ($short >= 4 && (strpos($a, $b) !== false || strpos($b, $a) !== false)) {
            $score = max($score, 0.80 + 0.15 * ($short / $long));
        }

        return round(min(1.0, $score), 4);
    }

    /** หน่วยกลาง เช่น "กก." "KGS" "กิโลกรัม" -> "kg" ถ้าไม่รู้จักคืน norm เดิม */
    public static function unit(?string $s): string
    {
        $n = self::norm($s);
        if ($n === '') return '';
        foreach (self::UNITS as $std => $alts) {
            foreach ($alts as $alt) {
                if ($n === self::norm($alt)) return $std;
            }
        }
        return $n;
    }

    public static function sameUnit(?string $a, ?string $b): bool
    {
        $ua = self::unit($a);
        $ub = self::unit($b);
        if ($ua === '' || $ub === '') return true;   // ไม่รู้หน่วยฝั่งใดฝั่งหนึ่ง = ไม่เตือน
        return $ua === $ub;
    }

    /** วันที่เป็น YYYY-MM-DD ถ้าเป็นปี พ.ศ. แปลงเป็น ค.ศ. ถ้าวันที่ผิดคืน null */
    public static function date($v): ?string
    {
        if (!is_string($v) || trim($v) === '') return null;
        $v = strtr(trim($v), self::THAI_DIGITS);
        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})/', $v, $m)) {
            $y = (int)$m[1];
            $mo = (int)$m[2];
            $d = (int)$m[3];
        } elseif (preg_match('/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/', $v, $m)) {
            /* แบบไทย วัน/เดือน/ปี เช่น 17/10/2569 หรือ 17/10/69 */
            $d = (int)$m[1];
            $mo = (int)$m[2];
            $y = (int)$m[3];
            if ($y < 100) $y += $y >= 40 ? 2500 : 2000;
        } else {
            return null;
        }
        if ($y > 2400) $y -= 543;
        if ($y < 2000 || $y > 2100 || !checkdate($mo, $d, $y)) return null;
        return sprintf('%04d-%02d-%02d', $y, $mo, $d);
    }

    public static function number($v): ?float
    {
        if ($v === null || $v === '') return null;
        if (is_int($v) || is_float($v)) return (float)$v;
        if (!is_string($v)) return null;
        $s = str_replace(array(',', ' '), '', strtr($v, self::THAI_DIGITS));
        return is_numeric($s) ? (float)$s : null;
    }

    public static function str($v, int $max = 255): ?string
    {
        if (!is_string($v) && !is_numeric($v)) return null;
        $s = trim((string)$v);
        if ($s === '') return null;
        return mb_substr($s, 0, $max, 'UTF-8');
    }
}
