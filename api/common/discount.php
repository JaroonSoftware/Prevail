<?php
/* ============================================================================
   ส่วนลดรวม % — กรอกที่ใบขายสินค้าเท่านั้น (3% หรือ 5%)
   ขั้นตอนอื่นคำนวณตาม ห้ามแก้เอง:
     ใบส่งของ : discount = ยอดก่อน VAT ของใบส่งของ (sum qty*price) x % ของใบขาย  (แบ่งตามสัดส่วนที่ส่งจริง)
     ใบวางบิล : discount = ผลรวม discount ของใบส่งของในบิล
   ต้องรัน sql/2026-11-18_so_discount_pct.sql ก่อน (ถ้ายังไม่รัน ฟังก์ชันทั้งหมดไม่ทำอะไร)
   ============================================================================ */
const SO_DISCOUNT_CHOICES = array(0, 3, 5);

function so_discount_ready(PDO $conn): bool
{
    static $ready = null;
    if ($ready === null) {
        $ready = (bool)$conn->query("SHOW COLUMNS FROM somaster LIKE 'discount_pct'")->fetch()
            && (bool)$conn->query("SHOW COLUMNS FROM dnmaster LIKE 'discount'")->fetch();
    }
    return $ready;
}

/** ตรวจค่าส่วนลดจากหน้าเว็บ คืน 0/3/5 */
function so_discount_value($value): float
{
    $v = ($value === null || $value === '') ? 0.0 : (float)$value;
    foreach (SO_DISCOUNT_CHOICES as $c) if (abs($v - $c) < 0.0001) return (float)$c;
    throw new Exception('ส่วนลดรวมเลือกได้เฉพาะ 3% หรือ 5%');
}

/** ใบขายนี้ออกใบส่งของ (ที่ยังไม่ยกเลิก) แล้วหรือยัง */
function so_has_delivery_note(PDO $conn, string $socode): bool
{
    $st = $conn->prepare("SELECT COUNT(*) FROM dnmaster m
        WHERE COALESCE(m.doc_status, '') <> 'ยกเลิก'
          AND (m.dncode = :s OR EXISTS (SELECT 1 FROM dndetail d WHERE d.dncode = m.dncode AND d.socode = :s2))");
    $st->execute(array('s' => $socode, 's2' => $socode));
    return (int)$st->fetchColumn() > 0;
}

/** บันทึก % ส่วนลดของใบขาย — ถ้าออกใบส่งของแล้ว ห้ามเปลี่ยน */
function so_save_discount(PDO $conn, string $socode, $value, bool $isNew): void
{
    if (!so_discount_ready($conn)) return;
    $pct = so_discount_value($value);
    if (!$isNew) {
        $st = $conn->prepare("SELECT discount_pct FROM somaster WHERE socode = :s");
        $st->execute(array('s' => $socode));
        $old = (float)$st->fetchColumn();
        if (abs($old - $pct) < 0.0001) return;
        if (so_has_delivery_note($conn, $socode)) {
            throw new Exception("แก้ส่วนลดไม่ได้: ใบขายสินค้า $socode ออกใบส่งของแล้ว");
        }
    }
    $conn->prepare("UPDATE somaster SET discount_pct = :p WHERE socode = :s")->execute(array('p' => $pct, 's' => $socode));
}

/** คำนวณส่วนลดของใบส่งของใหม่ (เรียกหลังบันทึก dndetail) */
function dn_apply_discount(PDO $conn, string $dncode): void
{
    if (!so_discount_ready($conn)) return;
    $st = $conn->prepare("SELECT COALESCE(MAX(s.discount_pct), 0) FROM dndetail d JOIN somaster s ON s.socode = d.socode WHERE d.dncode = :d");
    $st->execute(array('d' => $dncode));
    $pct = (float)$st->fetchColumn();
    $st = $conn->prepare("SELECT COALESCE(SUM(qty * price), 0) FROM dndetail WHERE dncode = :d");
    $st->execute(array('d' => $dncode));
    $sub = (float)$st->fetchColumn();
    $conn->prepare("UPDATE dnmaster SET discount_pct = :p, discount = :x WHERE dncode = :d")
         ->execute(array('p' => $pct, 'x' => round($sub * $pct / 100, 2), 'd' => $dncode));
}

/** ส่วนลดของใบวางบิล = ผลรวมส่วนลดของใบส่งของในบิล (เรียกหลังบันทึก bl_detail) */
function bill_apply_discount(PDO $conn, string $blcode): void
{
    if (!so_discount_ready($conn)) return;
    $st = $conn->prepare("SELECT COALESCE(SUM(m.discount), 0) FROM dnmaster m
        WHERE m.dncode IN (SELECT DISTINCT dncode FROM bl_detail WHERE blcode = :b)");
    $st->execute(array('b' => $blcode));
    $conn->prepare("UPDATE bl_master SET discount = :x WHERE blcode = :b")
         ->execute(array('x' => round((float)$st->fetchColumn(), 2), 'b' => $blcode));
}
