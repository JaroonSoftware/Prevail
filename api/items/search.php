<?php
ob_start();

/* ตัดช่องว่าง/เครื่องหมาย ตัวพิมพ์เล็ก */
function items_norm(string $s): string
{
    $s = mb_strtolower($s, 'UTF-8');
    return preg_replace('/[\s\p{P}\p{S}]+/u', '', $s) ?? '';
}

/* ชิ้นละ 2 ตัวอักษร ใช้วัดความคล้ายของชื่อภาษาไทย (ไทยไม่เว้นวรรคระหว่างคำ) */
function items_bigrams(string $s): array
{
    $ch = preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY) ?: array();
    $out = array();
    for ($i = 0; $i < count($ch) - 1; $i++) $out[] = $ch[$i] . $ch[$i + 1];
    return $out;
}

/* สัดส่วนชิ้นของคำค้นที่พบในชื่อ (0-1) */
function items_cover(array $q, array $name): float
{
    if (!$q) return 0.0;
    $pool = array_count_values($name);
    $hit = 0;
    foreach ($q as $g) {
        if (!empty($pool[$g])) { $hit++; $pool[$g]--; }
    }
    return $hit / count($q);
}

/* กรองชื่อสินค้า: ตรงตัว (ไม่สนช่องว่าง) ขึ้นก่อน แล้วตามด้วยชื่อที่คล้าย (>= 55% ของคำค้น เช่น หอมหัวใหญ่ ~ หอมใหญ่)
   ค้นทั้งชื่อไทย ชื่ออังกฤษ และชื่อย่อย (items_alias ถ้ามี) */
function items_name_filter(PDO $conn, array $rows, string $query): array
{
    $q = items_norm($query);
    if ($q === '') return $rows;
    $qg = items_bigrams($q);
    $aliases = array();
    if ($conn->query("SHOW TABLES LIKE 'items_alias'")->fetch()) {
        foreach ($conn->query("SELECT stcode, alias_name FROM items_alias") as $a) $aliases[$a['stcode']][] = $a['alias_name'];
    }
    $exact = array();
    $near = array();
    foreach ($rows as $r) {
        $names = array_merge(array((string)$r['stname'], (string)($r['stnameEN'] ?? '')), $aliases[$r['stcode']] ?? array());
        $best = 0.0;
        $isExact = false;
        foreach ($names as $n) {
            $nn = items_norm($n);
            if ($nn === '') continue;
            if (mb_strpos($nn, $q) !== false) { $isExact = true; break; }
            if (mb_strlen($q) >= 3) $best = max($best, items_cover($qg, items_bigrams($nn)));
        }
        if ($isExact) $exact[] = $r;
        elseif ($best >= 0.55) $near[] = $r + array('_score' => $best);
    }
    usort($near, function ($a, $b) { return $b['_score'] <=> $a['_score']; });
    foreach ($near as &$n) unset($n['_score']);
    unset($n);
    return array_merge($exact, $near);
}
include_once(dirname(__FILE__, 2) . "/onload.php");
$db = new DbConnect;
$conn = $db->connect();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);

    extract($_POST, EXTR_OVERWRITE, "_");


    $stcode = !empty($stcode) ? "and a.stcode like '%$stcode%'" : "";
    /* ชื่อสินค้า: ไม่กรองใน SQL แล้ว มากรองแบบยืดหยุ่นใน PHP ด้านล่าง
       (ไม่สนช่องว่าง, ค้นชื่ออังกฤษ/ชื่อย่อยด้วย, และชื่อที่ใกล้เคียง เช่น หอมหัวใหญ่ ~ หัวหอมใหญ่ ~ หอมใหญ่) */
    $nameQuery = trim((string)($stname ?? ''));
    $stname = "";
    $typecode = !empty($typecode) ? "and a.typecode like '%$typecode%'" : "";
    $active_status = !empty($active_status) ? "and a.active_status = '$active_status'" : "";
    try {
        $sql = "SELECT a.stcode, a.stname,a.stnameEN, b.typename, a.price,a.min, a.buyprice, a.weight_stable, a.weight, a.vat ,a.active_status,a.unit,a.packing_weight,        
        s.qty as stock 
        FROM `items` as a
        left outer join `itemtype` as b on (a.typecode=b.typecode)   
        left outer join `items_stock` as s on (a.stcode=s.stcode)     
        where 1=1
        $stcode
        $stname
        $typecode
        $active_status
        order by a.seq,a.stcode asc";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($nameQuery !== '') $res = items_name_filter($conn, $res, $nameQuery);

        http_response_code(200);
        // echo json_encode(array("data" => $res));
        echo json_encode(array("data" => $res));
    } catch (mysqli_sql_exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
        //throw $exception;
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
    } finally {
        $conn = null;
    }
} else {
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => 'request method fail.'));
}
ob_end_flush();
exit;
