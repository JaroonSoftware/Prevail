<?php
function dn_has_source_line(PDO $conn): bool
{
    return (bool)$conn->query("SHOW COLUMNS FROM dndetail LIKE 'source_so_detail_code'")->fetch();
}

function dn_line_changed(array $old, array $line): bool
{
    return (float)$old['qty'] !== (float)$line['qty']
        || (float)$old['price'] !== (float)$line['price']
        || (string)$old['unit'] !== (string)$line['unit'];
}

// Prefer saved source IDs. Legacy matches must preserve all source metadata.
function dn_source_line_map(array $rows, array $sources): array
{
    if (!$sources) return array();
    $map = array();
    foreach ($rows as $rowKey => $row) {
        if (empty($row['source_so_detail_code'])) continue;
        foreach ($sources as $key => $source) {
            if ((string)$source['code'] !== (string)$row['source_so_detail_code']) continue;
            $map[(string)$row['code']] = $source['code'];
            unset($sources[$key], $rows[$rowKey]);
            continue 2;
        }
        throw new Exception('รายการใบขายต้นทางถูกเปลี่ยนแปลง กรุณาตรวจสอบการเชื่อมรายการก่อนแก้ไขสินค้า');
    }
    if (count($rows) === 1 && count($sources) === 1) {
        $map[(string)reset($rows)['code']] = reset($sources)['code'];
        return $map;
    }
    foreach ($rows as $row) {
        $candidates = array();
        foreach ($sources as $key => $source) {
            if ((float)$source['qty'] === (float)$row['qty']
                && (float)$source['price'] === (float)$row['price']
                && (string)$source['unit'] === (string)$row['unit']) $candidates[] = $key;
        }
        if (count($candidates) > 1) {
            $metadata = [];
            foreach ($candidates as $candidate) {
                $values = $sources[$candidate];
                unset($values['code']);
                $metadata[] = $values;
            }
            foreach ($metadata as $values) {
                if ($values != $metadata[0]) {
                    throw new Exception('รายการสินค้าซ้ำมีข้อมูลต้นทุนหรือภาษีต่างกัน กรุณาตรวจสอบการเชื่อมรายการก่อนแก้ไขสินค้า');
                }
            }
        }
        if (!$candidates) {
            throw new Exception('ไม่สามารถระบุแถวรหัสสินค้าซ้ำในใบขายต้นทางได้แน่ชัด กรุณาตรวจสอบรายการก่อนบันทึก');
        }
        $key = $candidates[0];
        $map[(string)$row['code']] = $sources[$key]['code'];
        unset($sources[$key]);
    }
    return $map;
}
