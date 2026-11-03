<?php
/* ============================================================================
   อ่านไฟล์ .xlsx แบบไม่ต้องลงไลบรารีเพิ่ม (ใช้ ZipArchive + SimpleXML ที่มากับ PHP)
   คืนข้อความทีละแถว พร้อมตัวอักษรคอลัมน์ เพื่อส่งให้ AI อ่านต่อ
   เช่น  R12: A=1 | B=กะหล่ำปลีขาว | C=Cabbage White | D=kg | E=19 | F=51 | G=ถั่วแขก

   ใช้ค่าที่ Excel คำนวณเก็บไว้ (cached value) ของสูตร ไม่คำนวณสูตรเอง
   ============================================================================ */

final class XlsxReader
{
    /** คืน [ ['name' => ชื่อชีต, 'rows' => [ rowNo => [ 'A' => ค่า, ... ] ] ], ... ] */
    public static function read(string $path): array
    {
        if (!class_exists('ZipArchive')) {
            throw new AiUserException('เซิร์ฟเวอร์ยังไม่เปิด extension=zip ใน php.ini (ต้องใช้อ่านไฟล์ Excel) — เปิดแล้ว restart Apache');
        }
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) throw new AiUserException('เปิดไฟล์ Excel ไม่ได้ — ต้องเป็นไฟล์ .xlsx (ไฟล์ .xls รุ่นเก่าให้ Save As เป็น .xlsx ก่อน)');

        try {
            $shared = self::sharedStrings($zip);
            $sheets = self::sheetList($zip);
            $out = array();
            foreach ($sheets as $s) {
                $xml = $zip->getFromName($s['path']);
                if ($xml === false) continue;
                $out[] = array('name' => $s['name'], 'rows' => self::sheetRows($xml, $shared));
            }
            return $out;
        } finally {
            $zip->close();
        }
    }

    /** แปลงชีตเป็นข้อความทีละแถว (ข้ามแถวว่าง) */
    public static function toText(array $rows): array
    {
        $lines = array();
        foreach ($rows as $rn => $cells) {
            $parts = array();
            foreach ($cells as $col => $v) {
                $v = trim(preg_replace('/[\s\x{00A0}]+/u', ' ', (string)$v));
                if ($v === '') continue;
                $parts[] = "$col=$v";
            }
            if ($parts) $lines[$rn] = "R$rn: " . implode(' | ', $parts);
        }
        return $lines;
    }

    private static function sharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) return array();
        $sx = self::load($xml);
        $out = array();
        foreach ($sx->si as $si) {
            /* ข้อความธรรมดา <t> หรือข้อความหลายรูปแบบ <r><t> ต่อกัน */
            if (isset($si->t)) {
                $out[] = (string)$si->t;
            } else {
                $t = '';
                foreach ($si->r as $r) $t .= (string)$r->t;
                $out[] = $t;
            }
        }
        return $out;
    }

    private static function sheetList(ZipArchive $zip): array
    {
        $wb = self::load((string)$zip->getFromName('xl/workbook.xml'));
        $rels = self::load((string)$zip->getFromName('xl/_rels/workbook.xml.rels'));
        $target = array();
        foreach ($rels->Relationship as $r) $target[(string)$r['Id']] = (string)$r['Target'];

        $out = array();
        if (!isset($wb->sheets->sheet)) return array();
        foreach ($wb->sheets->sheet as $s) {
            $rid = (string)$s->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships')['id'];
            $t = $target[$rid] ?? null;
            if ($t === null) continue;
            $t = ltrim($t, '/');
            if (strpos($t, 'xl/') !== 0) $t = 'xl/' . $t;
            /* ชีตที่ซ่อนไว้ไม่เอา */
            if ((string)$s['state'] === 'hidden' || (string)$s['state'] === 'veryHidden') continue;
            $out[] = array('name' => (string)$s['name'], 'path' => $t);
        }
        return $out;
    }

    private static function sheetRows(string $xml, array $shared): array
    {
        $sx = self::load($xml);
        $rows = array();
        if (!isset($sx->sheetData)) return $rows;
        foreach ($sx->sheetData->row as $row) {
            $rn = (int)$row['r'];
            foreach ($row->c as $c) {
                $ref = (string)$c['r'];
                if (!preg_match('/^([A-Z]+)(\d+)$/', $ref, $m)) continue;
                $col = $m[1];
                $type = (string)$c['t'];
                if ($type === 's') {
                    $v = $shared[(int)$c->v] ?? '';
                } elseif ($type === 'inlineStr') {
                    $v = (string)($c->is->t ?? '');
                } elseif ($type === 'b') {
                    $v = ((string)$c->v) === '1' ? 'TRUE' : 'FALSE';
                } else {
                    $v = isset($c->v) ? (string)$c->v : '';
                    /* ตัวเลขทศนิยมยาวจากการคำนวณ เช่น 0.89999999 -> 0.9 */
                    if ($v !== '' && is_numeric($v) && strpos($v, '.') !== false) $v = (string)round((float)$v, 4);
                }
                if ($v !== '' && $v !== null) $rows[$rn ?: (int)$m[2]][$col] = $v;
            }
        }
        ksort($rows);
        return $rows;
    }

    private static function load(string $xml): SimpleXMLElement
    {
        /* ตัด BOM และ prefix ของ namespace หลัก (บางระบบส่งออกเป็น <x:workbook> <x:sheet> ...)
           ให้อ่านแบบเดียวกับไฟล์จาก Excel ปกติ */
        $xml = preg_replace('/^\xEF\xBB\xBF/', '', $xml);
        if (preg_match('/xmlns:(\w+)="http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main"/', $xml, $m)) {
            $xml = preg_replace('/<(\/?)' . $m[1] . ':/', '<$1', $xml);
            $xml = str_replace('xmlns:' . $m[1] . '=', 'xmlns=', $xml);
        }
        $prev = libxml_use_internal_errors(true);
        $sx = simplexml_load_string($xml);
        libxml_use_internal_errors($prev);
        if ($sx === false) throw new AiUserException('ไฟล์ Excel เสียหรือรูปแบบไม่ถูกต้อง');
        return $sx;
    }
}
