<?php
require_once __DIR__ . '/packing.php';

function catalog_items(PDO $conn, string $customer, ?string $date = null, string $type = ''): array {
    $date = catalog_date($date);
    $sql = "SELECT a.catalog_code, i.stcode AS value, i.stcode, i.stname AS label,
                   d.price, i.unit, i.vat, i.packing_weight
        FROM catalog_link a
        INNER JOIN catalog_detail d ON a.catalog_code = d.catalog_code
        INNER JOIN catalog_master m ON a.catalog_code = m.catalog_code
        INNER JOIN items i ON d.stcode = i.stcode
        LEFT JOIN itemtype t ON i.typecode = t.typecode
        WHERE a.cuscode = :customer
          AND COALESCE(:catalog_date, CURDATE()) BETWEEN m.start_date AND m.stop_date
          AND m.active_status = 'Y'";
    $params = ['customer' => $customer, 'catalog_date' => $date];
    if ($type !== '') {
        $sql .= ' AND LOWER(t.typename) = LOWER(:type)';
        $params['type'] = $type;
    }
    $sql .= ' ORDER BY i.seq, m.start_date DESC, a.catalog_code DESC';
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = packing_catalog_rows($conn, $stmt->fetchAll(PDO::FETCH_ASSOC), $customer);
    $unique = [];
    foreach ($rows as $row) {
        if (!isset($unique[$row['stcode']])) $unique[$row['stcode']] = $row;
    }
    return array_values($unique);
}
