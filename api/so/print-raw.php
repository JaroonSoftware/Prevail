<?php
/* ============================================================================
   ใบขายสินค้า — ESC/P raw สำหรับ EPSON LQ-310 (dot matrix 24 เข็ม)
   กระดาษต่อเนื่อง 9 x 11 นิ้ว

   ทำไมต้องมีไฟล์นี้ ทั้งที่มีฟอร์ม HTML อยู่แล้ว:
   พิมพ์ผ่าน Chrome = graphics mode วาดตัวอักษรเป็นจุดเล็กๆ กระจาย
   ผ่านคาร์บอนลงชั้น 2-3-4 แล้วสระกับวรรณยุกต์ไทยเลือนจนอ่านไม่ออก
   draft mode ตอกเป็นเส้นหนาทึบ สำเนาติดครบทุกชั้น และเร็วกว่า ~15 เท่า

   ---- พารามิเตอร์ ----
   ?code=SO25xxxx     เลขที่ใบขายสินค้า (บังคับ)
   ?debug=1           คืนเป็น text UTF-8 พร้อมไม้บรรทัด ดูใน browser ได้
                      ว่าตัวเลขลงช่องตรงไหม (ไม่ส่ง ESC/P byte จริง)
   ?selftest=1        พิมพ์ตาราง byte ภาษาไทย ใช้หาว่าเครื่องต้องสั่งโหมดไหน
   ?thai=a|b|c|none   เลือกวิธีสั่งโหมดไทย (ดู thai_init() ข้างล่าง)
   ?preprint=1        กระดาษพรีปรินต์ — ข้ามหัวบริษัท พิมพ์เฉพาะข้อมูลลงช่อง

   ---- ยังไม่ได้ต่อเข้าเครื่องพิมพ์ ----
   ไฟล์นี้แค่ "สร้าง byte stream" เท่านั้น เว็บรันบนโฮสต์ PHP จึงเอื้อมไม่ถึง
   เครื่องพิมพ์ในร้านลูกค้า ขาสุดท้ายต้องเป็น local agent บนเครื่องนั้น
   (งานก้อนถัดไป) ตอนนี้ทดสอบโดยเซฟ response เป็น .prn แล้ว copy /b เอง
============================================================================ */

/* ---- สวิตช์ทดสอบ ----
   true = ให้ ?debug=1 และ ?selftest=1 เรียกได้โดยไม่ต้องมี token
   เอาไว้เปิดดู layout จาก address bar ตอนพัฒนา
   ***ต้องเป็น false เสมอบนเครื่องจริง*** ไม่งั้นใครก็ดึงข้อมูลใบขายได้ */
const PRINT_RAW_DEBUG_OPEN = false;

ob_start();
error_reporting(E_ERROR | E_PARSE);
date_default_timezone_set('Asia/Bangkok');
include_once(dirname(__FILE__, 2) . "/conn.php");

$isDebug    = !empty($_GET['debug']);
$isSelftest = !empty($_GET['selftest']);

/* authenticate.php ทำ exit เองเมื่อ token ไม่ผ่าน จึงต้อง include แบบมีเงื่อนไข
   ไม่ใช่ include onload.php ทั้งก้อนเหมือน endpoint อื่น */
if (!(PRINT_RAW_DEBUG_OPEN && ($isDebug || $isSelftest))) {
    include_once(dirname(__FILE__, 2) . "/authenticate.php");
}

/* ============================================================================
   ESC/P
============================================================================ */
const ESC = "\x1B";
const FF  = "\x0C";
const SI  = "\x0F";   // condensed 17.1 cpi
const DC2 = "\x12";   // ยกเลิก condensed

/** ความกว้างฟอร์ม 80 ตัวอักษรที่ 10 cpi = 8 นิ้ว (พื้นที่พิมพ์สูงสุดของ LQ-310) */
const COLS  = 80;
/** 11 นิ้ว x 6 บรรทัด/นิ้ว */
const LINES = 66;
/** จำนวนรายการสินค้าต่อหน้า — ดูการจัดบรรทัดใน build_page() */
const ROWS_PER_PAGE = 30;

/**
 * คำสั่งเปิดโหมดภาษาไทย
 *
 * LQ-310 ที่ขายในไทยมีฟอนต์ไทยในตัว แต่วิธีเปิดต่างกันตามล็อต/รุ่นย่อย
 * บางเครื่องตั้งที่ DIP switch มาแล้วไม่ต้องสั่งอะไร บางเครื่องต้องสั่ง
 * เลือก character table ก่อน เดาไม่ได้ ต้องยิงทดสอบกับเครื่องจริง
 * ใช้ ?selftest=1 หาว่าตัวไหนถูก แล้วมาแก้ค่า default ตรงนี้
 */
function thai_init($mode)
{
    switch ($mode) {
        case 'a':    return ESC . 't' . chr(1);   // character table 1
        case 'b':    return ESC . 't' . chr(0);   // character table 0
        case 'c':    return ESC . 'R' . chr(0);   // international charset = USA
        case 'none': return '';
        default:     return ESC . 't' . chr(1);
    }
}

/* ============================================================================
   จัดคอลัมน์ภาษาไทย

   ปัญหา: สระบน-ล่างกับวรรณยุกต์ไทยไม่กินความกว้าง หัวพิมพ์ตอกทับตัวก่อนหน้า
   ถ้านับความยาวด้วย strlen ตรงๆ คอลัมน์จะเลื่อนทุกครั้งที่เจอคำมีสระ
   ต้องนับเฉพาะตัวที่ "กินที่" จริง
============================================================================ */

/** byte ใน TIS-620 ที่ไม่กินความกว้าง: ั, ิ-ฺ, ็-๎ */
function is_zero_width($byte)
{
    $b = ord($byte);
    return $b === 0xD1
        || ($b >= 0xD4 && $b <= 0xDA)
        || ($b >= 0xE7 && $b <= 0xEE);
}

/** ความกว้างที่พิมพ์จริงของสตริง TIS-620 (หน่วย: ตัวอักษร) */
function tis_width($s)
{
    $w = 0;
    for ($i = 0; $i < strlen($s); $i++) {
        if (!is_zero_width($s[$i])) $w++;
    }
    return $w;
}

/** ตัดให้เหลือความกว้าง $w โดยไม่ตัดสระหลุดจากพยัญชนะ */
function tis_cut($s, $w)
{
    $out = '';
    $used = 0;
    for ($i = 0; $i < strlen($s); $i++) {
        $ch = $s[$i];
        if (is_zero_width($ch)) {
            /* สระลอยตามตัวก่อนหน้าเสมอ ไม่นับความกว้าง และห้ามทิ้งไว้ต้นสตริง */
            if ($used > 0) $out .= $ch;
            continue;
        }
        if ($used + 1 > $w) break;
        $out .= $ch;
        $used++;
    }
    return $out;
}

/** ชิดซ้าย เติมช่องว่างขวา */
function padr($s, $w)
{
    $s = tis_cut($s, $w);
    return $s . str_repeat(' ', max(0, $w - tis_width($s)));
}

/** ชิดขวา เติมช่องว่างซ้าย */
function padl($s, $w)
{
    $s = tis_cut($s, $w);
    return str_repeat(' ', max(0, $w - tis_width($s))) . $s;
}

/** จัดกลาง */
function padc($s, $w)
{
    $s = tis_cut($s, $w);
    $left = intdiv(max(0, $w - tis_width($s)), 2);
    return str_repeat(' ', $left) . $s . str_repeat(' ', max(0, $w - tis_width($s) - $left));
}

/** UTF-8 -> TIS-620 (โหมด debug ไม่แปลง จะได้อ่านออกใน browser) */
function enc($s)
{
    global $isDebug;
    $s = (string) $s;
    if ($isDebug) return $s;
    $out = @iconv('UTF-8', 'TIS-620//TRANSLIT', $s);
    return $out === false ? $s : $out;
}

function money($v, $dec = 2)
{
    return number_format((float) $v, $dec, '.', ',');
}

/* ============================================================================
   ตัดคำภาษาไทยแบบง่าย

   ไทยไม่มีช่องว่างระหว่างคำ ตัดตามคำจริงต้องใช้พจนานุกรม เกินจำเป็นสำหรับ
   ชื่อสินค้า จึงตัดตามความกว้างแล้วไม่ให้สระหลุด (tis_cut ดูแลให้แล้ว)
============================================================================ */
function wrap_lines($s, $w, $max)
{
    $lines = [];
    $rest = (string) $s;
    while ($rest !== '' && count($lines) < $max) {
        $chunk = tis_cut($rest, $w);
        if ($chunk === '') break;
        $lines[] = $chunk;
        $rest = substr($rest, strlen($chunk));
    }
    return $lines ?: [''];
}

/* ============================================================================
   ดึงข้อมูล
============================================================================ */
$db = new DbConnect;
$conn = $db->connect();
http_response_code(400);

try {
    $thaiMode = $_GET['thai'] ?? 'default';

    /* ---- selftest: ไม่แตะฐานข้อมูล ยิงตาราง byte ไทยออกไปเลย ----
       เอาไว้หาว่าเครื่องต้องสั่งโหมดไหนถึงจะได้ไทย ลองทีละค่า a/b/c/none
       แล้วดูว่าใบไหนออกมาเป็นภาษาไทยอ่านได้ */
    if ($isSelftest) {
        $out  = ESC . '@';
        $out .= ESC . 'C' . chr(0) . chr(11);
        $out .= ESC . 'x' . chr(0);
        $out .= thai_init($thaiMode);
        $out .= "THAI SELFTEST  mode=" . $thaiMode . "\r\n\r\n";
        for ($row = 0xA0; $row <= 0xF0; $row += 0x10) {
            $line = strtoupper(dechex($row)) . ': ';
            for ($col = 0; $col < 16; $col++) {
                $line .= chr($row + $col) . ' ';
            }
            $out .= $line . "\r\n";
        }
        $out .= "\r\n" . enc('ทดสอบภาษาไทย สระอิอีอึอื วรรณยุกต์ ก่ ก้ ก๊ ก๋') . "\r\n";
        $out .= FF;

        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="selftest.prn"');
        ob_end_clean();
        echo $out;
        exit;
    }

    $code = $_GET['code'] ?? '';
    if ($code === '') throw new Exception('ต้องระบุ code (เลขที่ใบขายสินค้า)');

    $sql = "SELECT a.socode,a.sodate,a.deldate,a.customer_po,a.del_room,a.cuscode,
            CONCAT(COALESCE(c.prename,''),' ',COALESCE(c.cusname,'')) as cusname,
            CONCAT(COALESCE(c.idno,''),' ',COALESCE(c.road,''),' ',COALESCE(c.subdistrict,''),' ',
                   COALESCE(c.district,''),' ',COALESCE(c.province,''),' ',COALESCE(c.zipcode,'')) as address,
            c.idno, c.contact, c.tel, a.total_price, a.remark
            FROM `somaster` as a
            left outer join `customer` as c on (a.cuscode = c.cuscode)
            where a.socode = :code";
    $stmt = $conn->prepare($sql);
    $stmt->execute(['code' => $code]);
    $h = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$h) throw new Exception('ไม่พบใบขายสินค้า ' . $code);

    $sql = "SELECT a.stcode, a.price, a.unit, a.qty, a.vat, a.discount, i.stname
            FROM `sodetail` as a inner join `items` as i on (a.stcode = i.stcode)
            where a.socode = :code";
    $stmt = $conn->prepare($sql);
    $stmt->execute(['code' => $code]);
    $details = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    /* ============================================================================
       ผังคอลัมน์ตารางสินค้า — รวมพอดี 80
       4 + 1 + 10 + 1 + 26 + 1 + 8 + 1 + 6 + 1 + 9 + 1 + 11 = 80
    ============================================================================ */
    $W_NO   = 4;
    $W_CODE = 10;
    $W_NAME = 26;
    $W_QTY  = 8;
    $W_UNIT = 6;
    $W_PRC  = 9;
    $W_AMT  = 11;

    $rule = str_repeat('-', COLS);

    $head_row =
        padc(enc('ลำดับ'), $W_NO) . ' ' .
        padr(enc('รหัสสินค้า'), $W_CODE) . ' ' .
        padr(enc('ชื่อสินค้า'), $W_NAME) . ' ' .
        padl(enc('จำนวน'), $W_QTY) . ' ' .
        padc(enc('หน่วย'), $W_UNIT) . ' ' .
        padl(enc('ราคา'), $W_PRC) . ' ' .
        padl(enc('จำนวนเงิน'), $W_AMT);

    /* ---- แตกรายการเป็นบรรทัด (ชื่อยาวกินได้ 2 บรรทัด) ---- */
    $body = [];
    $grand = 0.0;
    foreach ($details as $i => $d) {
        $qty   = (float) ($d['qty'] ?? 0);
        $price = (float) ($d['price'] ?? 0);
        $disc  = (float) ($d['discount'] ?? 0);
        $amt   = $qty * $price * (1 - $disc / 100);
        $grand += $amt;

        $nameLines = wrap_lines(enc($d['stname'] ?? ''), $W_NAME, 2);

        $body[] =
            padl((string) ($i + 1), $W_NO) . ' ' .
            padr(enc($d['stcode'] ?? ''), $W_CODE) . ' ' .
            padr($nameLines[0], $W_NAME) . ' ' .
            padl(money($qty), $W_QTY) . ' ' .
            padc(enc($d['unit'] ?? ''), $W_UNIT) . ' ' .
            padl(money($price), $W_PRC) . ' ' .
            padl(money($amt), $W_AMT);

        if (isset($nameLines[1]) && $nameLines[1] !== '') {
            $body[] =
                str_repeat(' ', $W_NO + 1 + $W_CODE + 1) .
                padr($nameLines[1], $W_NAME);
        }
    }

    /* ============================================================================
       ประกอบหน้า
    ============================================================================ */
    $isPreprint = !empty($_GET['preprint']);

    $pages = array_chunk($body, ROWS_PER_PAGE) ?: [[]];
    $totalPages = count($pages);

    $doc = '';
    foreach ($pages as $pi => $rows) {
        $isLast = ($pi === $totalPages - 1);
        $L = [];   // บรรทัดของหน้านี้

        if (!$isPreprint) {
            $L[] = padc(enc('บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด'), COLS);
            $L[] = padc(enc('60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000'), COLS);
            $L[] = padc(enc('TEL: 076 641 117, 098 192 9391'), COLS);
            $L[] = padc(enc('เลขประจำตัวผู้เสียภาษี 083556101164 (สำนักงานใหญ่)'), COLS);
            $L[] = '';
            $L[] = padc(enc('ใบขายสินค้า'), COLS);
        } else {
            /* พรีปรินต์: หัวบริษัทพิมพ์มากับกระดาษแล้ว เว้นที่ไว้เฉยๆ
               ให้จำนวนบรรทัดเท่ากันทั้งสองโหมด ตำแหน่งข้างล่างจะได้ไม่ขยับ */
            $L = array_merge($L, array_fill(0, 6, ''));
        }
        $L[] = '';

        /* ---- หัวเอกสาร: ซ้าย = ลูกค้า / ขวา = เลขที่+วันที่ ---- */
        $LW = 46;   // คอลัมน์ซ้าย
        $RW = COLS - $LW - 1;

        $left = [
            enc('ลูกค้า     ') . enc($h['cuscode']),
            enc($h['cusname']),
            enc($h['address']),
            enc('ผู้เสียภาษี ') . enc($h['idno'] ?: '-'),
            enc('ผู้ติดต่อ  ') . enc($h['contact'] ?: '-'),
            enc('โทร        ') . enc($h['tel'] ?: '-'),
        ];
        $right = [
            enc('เลขที่     ') . enc($h['socode']),
            enc('วันที่      ') . ($h['sodate'] ? date('d/m/Y', strtotime($h['sodate'])) : '-'),
            enc('PO ลูกค้า  ') . enc($h['customer_po'] ?: '-'),
            enc('วันที่นัดส่ง ') . ($h['deldate'] ? date('d/m/Y', strtotime($h['deldate'])) : '-'),
            enc('ห้องครัว   ') . enc($h['del_room'] ?: '-'),
            $totalPages > 1 ? enc('หน้า       ') . ($pi + 1) . '/' . $totalPages : '',
        ];
        for ($i = 0; $i < 6; $i++) {
            $L[] = padr($left[$i] ?? '', $LW) . ' ' . padr($right[$i] ?? '', $RW);
        }

        $L[] = '';
        $L[] = $rule;
        $L[] = $head_row;
        $L[] = $rule;

        foreach ($rows as $r) $L[] = $r;
        /* เติมบรรทัดว่างให้ตารางสูงเท่ากันทุกหน้า ท้ายใบจะได้อยู่ที่เดิมเสมอ */
        for ($i = count($rows); $i < ROWS_PER_PAGE; $i++) $L[] = '';

        $L[] = $rule;

        if ($isLast) {
            $vat = $grand * 0.07;
            $L[] = padr(enc('หมายเหตุ ') . enc($h['remark'] ?: '-'), 55) .
                   padr(enc('รวมเป็นเงิน'), 13) . padl(money($grand), 12);
            $L[] = padr('', 55) . padr(enc('ภาษี 7%'), 13) . padl(money($vat), 12);
            $L[] = padr('', 55) . padr(enc('ยอดสุทธิ'), 13) . padl(money($grand + $vat), 12);
            $L[] = $rule;
            $L[] = '';
            $L[] = enc('ยืนยันรายการใบขายสินค้าตามรายละเอียดข้างต้น');
            $L[] = '';
            $L[] = enc('ผู้ยืนยัน ______________________    ') .
                   enc('ผู้รับสินค้า ______________________');
            $L[] = enc('วันที่     ____/____/______        ') .
                   enc('วันที่       ____/____/______');
        } else {
            $L[] = padr('', 55) . padr(enc('ยกยอดไปหน้าถัดไป'), 25);
        }

        /* ---- ประกอบเป็น byte + เติมให้ครบ 66 บรรทัด แล้วขึ้นฟอร์มใหม่ ----
           ปล่อยให้ ESC C ตั้งความยาวฟอร์มเป็นคนตัดหน้า ไม่ใช่นับบรรทัดเอง
           กระดาษต่อเนื่องจะได้ไม่เลื่อนสะสมเมื่อรายการในใบไม่เท่ากัน */
        if (count($L) > LINES) {
            $L = array_slice($L, 0, LINES);
        }
        $doc .= implode("\r\n", $L);
        $doc .= FF;
    }

    /* ============================================================================
       ส่งออก
    ============================================================================ */
    if ($isDebug) {
        /* ไม้บรรทัดไว้นับคอลัมน์ด้วยตา + แทน FF ด้วยเส้นคั่นหน้าให้เห็นชัด */
        $ruler = '';
        for ($i = 1; $i <= COLS; $i++) $ruler .= ($i % 10 === 0) ? (string) intdiv($i, 10) : '.';
        $preview = $ruler . "\n" . str_repeat('=', COLS) . "\n"
                 . str_replace([FF, "\r\n"], ["\n" . str_repeat('=', COLS) . " [FF]\n", "\n"], $doc);

        header('Content-Type: text/plain; charset=utf-8');
        http_response_code(200);
        ob_end_clean();
        echo $preview;
        exit;
    }

    $out  = ESC . '@';                          // reset
    $out .= ESC . 'C' . chr(0) . chr(11);       // ความยาวฟอร์ม 11 นิ้ว
    $out .= ESC . 'x' . chr(0);                 // draft — เร็วสุด สำเนาติดชัดสุด
    $out .= ESC . 'P';                          // 10 cpi = 80 คอลัมน์
    $out .= thai_init($thaiMode);
    $out .= $doc;

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $code . '.prn"');
    header('X-Print-Bytes: ' . strlen($out));
    http_response_code(200);
    ob_end_clean();
    echo $out;
    exit;

} catch (PDOException $e) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => '0', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => '0', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} finally {
    $conn = null;
}
