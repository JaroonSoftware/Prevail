<?php
require_once __DIR__ . '/catalog-date.php';
// Packing sizes use the sales quantity unit, never an assumed kilogram unit.
function packing_schema_ready(PDO $conn): bool {
    static $ready = null;
    if ($ready === null) $ready = (bool)$conn->query("SHOW COLUMNS FROM sodetail LIKE 'packing_weight'")->fetch()
        && (bool)$conn->query("SHOW TABLES LIKE 'catalog_customer_packing'")->fetch();
    return $ready;
}
function packing_require_schema(PDO $conn): void {
    if (!packing_schema_ready($conn)) throw new Exception('Please run sql/2026-11-08_customer_catalog_packing.sql before saving packing sizes or sales orders.');
}
function packing_value($value): ?string {
    if ($value === null || $value === '') return null;
    if (!is_numeric($value) || !is_finite((float)$value) || (float)$value <= 0 || (float)$value > 9999999.99
        || abs((float)$value * 100 - round((float)$value * 100)) > 0.000001) {
        throw new Exception('Packing size must be positive, at most 9999999.99, with at most 2 decimal places.');
    }
    return number_format((float)$value, 2, '.', '');
}
function packing_split($qty, $pack): array {
    $pack = packing_value($pack);
    if ($pack === null) throw new Exception('Packing size is required.');
    $qty = packing_value($qty);
    if ($qty === null) throw new Exception('Quantity is required.');
    $q = (int)round((float)$qty * 100); $p = (int)round((float)$pack * 100);
    $full = intdiv($q, $p); $remain = (float)(($q % $p) / 100);
    if ($full + ($remain > 0 ? 1 : 0) > 10000) throw new Exception('Too many bags (maximum 10000 per item).');
    return [$full, $remain];
}
/* เทียบหน่วยแบบไม่สนตัวพิมพ์/ช่องว่าง และถือว่า Kilogram = kg (KG, Kg, kilogram, kilograms) */
function packing_unit_key($u): string {
    $u = mb_strtolower(trim((string)$u), 'UTF-8');
    $u = preg_replace('/\s+/u', '', $u);
    if (in_array($u, array('kg', 'kg.', 'kgs', 'kilogram', 'kilograms', 'กก', 'กก.', 'กิโลกรัม'), true)) return 'kg';
    return (string)$u;
}
function packing_catalog_rows(PDO $conn, array $rows, string $cuscode): array {
    if (!packing_schema_ready($conn)) return $rows;
    $st = $conn->prepare('SELECT packing_weight, unit FROM catalog_customer_packing WHERE catalog_code = :c AND cuscode = :u AND stcode = :s');
    foreach ($rows as &$row) {
        $st->execute(['c'=>$row['catalog_code'], 'u'=>$cuscode, 's'=>$row['stcode']]);
        $override = $st->fetch(PDO::FETCH_ASSOC);
        if ($override) {
            // Do not silently reinterpret an old size if the product unit changed.
            $same = packing_unit_key($override['unit']) === packing_unit_key($row['unit']);
            $row['packing_weight'] = $same ? $override['packing_weight'] : null;
            $row['packing_unit_mismatch'] = !$same;
            $row['packing_override_unit'] = $override['unit'];
        }
    }
    return $rows;
}
function packing_resolve(PDO $conn, string $customer, array $line, ?string $catalogDate = null): ?string {
    $catalogDate = catalog_date($catalogDate);
    $st = $conn->prepare("SELECT a.catalog_code, i.stcode, i.unit, i.packing_weight
        FROM catalog_link a JOIN catalog_master m ON m.catalog_code=a.catalog_code
        JOIN catalog_detail d ON d.catalog_code=a.catalog_code JOIN items i ON i.stcode=d.stcode
        WHERE a.cuscode=:c AND d.stcode=:s AND m.active_status='Y'
        AND COALESCE(:catalog_date, CURDATE()) BETWEEN m.start_date AND m.stop_date ORDER BY m.start_date DESC, a.catalog_code DESC");
    $st->execute(['c'=>$customer, 's'=>$line['stcode'], 'catalog_date'=>$catalogDate]);
    $rows = packing_catalog_rows($conn, $st->fetchAll(PDO::FETCH_ASSOC), $customer);
    if (!empty($line['catalog_code'])) {
        $rows = array_values(array_filter($rows, function($r) use ($line) { return $r['catalog_code'] === $line['catalog_code']; }));
        if (!$rows) throw new Exception('Selected catalog is no longer valid for this customer. Please select the item again.');
    }
    if (!$rows) {
        $st = $conn->prepare('SELECT unit, packing_weight FROM items WHERE stcode=:s');
        $st->execute(['s'=>$line['stcode']]); $row = $st->fetch(PDO::FETCH_ASSOC);
    } else $row = $rows[0];
    if (!$row) throw new Exception('Item not found.');
    /* ขายต่างหน่วยจากหน่วยสินค้า (เช่น สินค้าเป็น PCS แต่ขายเป็น KG): ยอมให้บันทึก
       แต่ไม่มีน้ำหนักต่อถุง -> ตอนปริ้นหน้าถุงจะออกเป็นถุงเดียวตามจำนวนทั้งหมด */
    if (packing_unit_key($row['unit']) !== packing_unit_key($line['unit'])) return null;
    if (!empty($row['packing_unit_mismatch'])) {
        throw new Exception("สินค้า {$line['stcode']}: น้ำหนักต่อถุงในแคตตาล็อก ({$row['catalog_code']}) ตั้งไว้เป็นหน่วย {$row['packing_override_unit']} แต่สินค้าเป็นหน่วย {$row['unit']} — เปิดแคตตาล็อกแล้วกรอกน้ำหนักต่อถุงใหม่");
    }
    return (float)($row['packing_weight'] ?? 0) > 0 ? packing_value($row['packing_weight']) : null;
}
function packing_prepare_lines(PDO $conn, array $lines, string $customer, ?string $socode = null, ?string $catalogDate = null): array {
    packing_require_schema($conn);
    $old = [];
    if ($socode !== null) {
        $st = $conn->prepare('SELECT cuscode FROM somaster WHERE socode=:s FOR UPDATE');
        $st->execute(['s'=>$socode]); $oldCustomer = $st->fetchColumn();
        /* ใบที่ปริ้นหน้าถุงแล้วแก้ได้: so/manage.php จัดการ barcode เอง (บรรทัดที่ไม่เปลี่ยนเก็บถุงไว้ บรรทัดที่เปลี่ยนล้างถุง) */
        if ($oldCustomer === $customer) {
            $st = $conn->prepare('SELECT code, stcode, unit, packing_weight FROM sodetail WHERE socode=:s ORDER BY code');
            $st->execute(['s'=>$socode]); $old = $st->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    foreach ($lines as &$line) {
        $match = null;
        foreach ($old as $key=>$prior) {
            if ($prior['stcode'] === $line['stcode'] && $prior['unit'] === $line['unit']
                && (!isset($line['code']) || (string)$line['code'] === (string)$prior['code'])) {
                $match=$prior; unset($old[$key]); break;
            }
        }
        // Existing line snapshots (including NULL) are authoritative, not the browser payload.
        $line['packing_weight'] = $match !== null ? $match['packing_weight'] : packing_resolve($conn,$customer,$line,$catalogDate);
    }
    return $lines;
}
function packing_save_catalog(PDO $conn, string $catalog, array $details, array $customers): void {
    $hasValues = false;
    foreach ($details as $d) if (!empty($d['customer_packing'])) $hasValues = true;
    if (!packing_schema_ready($conn)) {
        if ($hasValues) packing_require_schema($conn);
        return;
    }
    $previous = packing_load_catalog($conn, $catalog, $details);
    foreach ($details as $key=>&$detail) {
        if (!array_key_exists('customer_packing', $detail)) $detail['customer_packing'] = $previous[$key]['customer_packing'];
    }
    unset($detail);
    $allowed = array_fill_keys(array_map(function($c){return (string)$c['cuscode'];}, $customers), true);
    $st = $conn->prepare('DELETE FROM catalog_customer_packing WHERE catalog_code=:c'); $st->execute(['c'=>$catalog]);
    $item = $conn->prepare('SELECT unit FROM items WHERE stcode=:s');
    $insert = $conn->prepare('INSERT INTO catalog_customer_packing (catalog_code,cuscode,stcode,unit,packing_weight) VALUES (:c,:u,:s,:unit,:p)');
    foreach ($details as $d) {
        $item->execute(['s'=>$d['stcode']]); $unit = $item->fetchColumn();
        foreach (($d['customer_packing'] ?? []) as $customer=>$value) {
            if (!isset($allowed[(string)$customer])) continue;
            $pack = packing_value($value); if ($pack === null) continue;
            if ($unit === false || (isset($d['unit']) && $d['unit'] !== $unit)) throw new Exception('Item unit changed. Reload the catalog before saving.');
            $insert->execute(['c'=>$catalog,'u'=>$customer,'s'=>$d['stcode'],'unit'=>$unit,'p'=>$pack]);
        }
    }
}
function packing_load_catalog(PDO $conn, string $catalog, array $details): array {
    $map=[];
    if (packing_schema_ready($conn)) {
        $st=$conn->prepare('SELECT cuscode,stcode,unit,packing_weight FROM catalog_customer_packing WHERE catalog_code=:c');
        $st->execute(['c'=>$catalog]);
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) $map[$r['stcode']][$r['cuscode']]=$r;
    }
    foreach ($details as &$d) {
        $d['customer_packing']=[]; $d['customer_packing_units']=[];
        foreach (($map[$d['stcode']] ?? []) as $c=>$r) {
            $d['customer_packing'][$c]=$r['packing_weight']; $d['customer_packing_units'][$c]=$r['unit'];
        }
    }
    return $details;
}
