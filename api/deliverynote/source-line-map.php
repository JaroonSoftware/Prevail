<?php
// Resolve only provable row matches. Never assign unmatched duplicate rows by position.
function dn_source_line_map(array $rows, array $sources): array
{
    if (!$sources) return array();
    if (count($rows) === 1 && count($sources) === 1) {
        return array((string)$rows[0]['code'] => $sources[0]['code']);
    }
    $map = array();
    foreach ($rows as $row) {
        $candidates = array();
        foreach ($sources as $key => $source) {
            if ((float)$source['qty'] === (float)$row['qty']
                && (float)$source['price'] === (float)$row['price']
                && (string)$source['unit'] === (string)$row['unit']) $candidates[] = $key;
        }
        // Even identical visible rows may carry different VAT/cost metadata.
        // Without a persisted source-row ID their identities cannot be proved.
        if (count($candidates) !== 1) {
            throw new Exception('ไม่สามารถระบุแถวรหัสสินค้าซ้ำในใบขายต้นทางได้แน่ชัด กรุณาตรวจสอบรายการก่อนบันทึก');
        }
        $key = $candidates[0];
        $map[(string)$row['code']] = $sources[$key]['code'];
        unset($sources[$key]);
    }
    return $map;
}
