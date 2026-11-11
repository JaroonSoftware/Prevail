<?php
require_once __DIR__ . '/../api/deliverynote/source-line-map.php';

function expect($condition, string $message): void {
    if (!$condition) throw new Exception($message);
}
function rejects(callable $operation): void {
    try { $operation(); } catch (Exception $error) { return; }
    throw new Exception('Expected ambiguous or stale source to be rejected');
}

$source = ['code' => 10, 'qty' => '8.000', 'price' => '26.00', 'unit' => 'KG', 'vat' => '0', 'total_cost' => '50'];
$second = array_merge($source, ['code' => 11]);
$row = ['code' => 100, 'qty' => 8, 'price' => 26, 'unit' => 'KG'];
$otherRow = array_merge($row, ['code' => 101]);

expect(!dn_line_changed($row, array_merge($row, ['qty' => '8.000', 'price' => '26.00'])), 'Numeric strings are unchanged');
expect(dn_line_changed($row, array_merge($row, ['qty' => 9])), 'Quantity change');
expect(dn_line_changed($row, array_merge($row, ['price' => 27])), 'Price change');
expect(dn_line_changed($row, array_merge($row, ['unit' => 'PACK'])), 'Unit change');

$map = dn_source_line_map([$row, $otherRow], [$source, $second]);
expect($map === [100 => 10, 101 => 11], 'Equivalent legacy duplicate rows remain separate');
$differentTax = array_merge($second, ['vat' => '7']);
rejects(function () use ($row, $otherRow, $source, $differentTax) {
    dn_source_line_map([$row, $otherRow], [$source, $differentTax]);
});
$linked = array_merge($row, ['source_so_detail_code' => '11']);
$map = dn_source_line_map([$linked, $otherRow], [$source, $differentTax]);
expect($map === [100 => 11, 101 => 10], 'Saved IDs take priority over identical visible values');
rejects(function () use ($linked, $source) { dn_source_line_map([$linked], [$source]); });
rejects(function () use ($linked, $source, $second) {
    dn_source_line_map([$linked, array_merge($linked, ['code' => 101])], [$source, $second]);
});
$map = dn_source_line_map([$row, array_merge($otherRow, ['qty' => 20])], [$source, array_merge($second, ['qty' => 20])]);
expect($map === [100 => 10, 101 => 11], 'Distinct quantities match separate source lines');
echo "PASS: unchanged data, editable fields, legacy duplicates, saved links, stale links and tax ambiguity\n";
