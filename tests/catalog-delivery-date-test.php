<?php
require_once __DIR__ . '/../api/common/catalog-items.php';

// Execute the real selection queries against in-memory CTE fixtures only.
// No connection to the application database and no schema/data mutations.
class CatalogFixture extends PDO {
    public function __construct() {
        parent::__construct('sqlite::memory:');
        $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->sqliteCreateFunction('CURDATE', function () { return '2026-11-12'; });
    }
    public function query(string $query, ?int $fetchMode = null, ...$fetchModeArgs): PDOStatement|false {
        if (strpos($query, 'SHOW ') === 0) return parent::query('SELECT 1 WHERE 0');
        return parent::query($query);
    }
    public function prepare(string $query, array $options = []): PDOStatement|false {
        $fixtures = "WITH
            catalog_master(catalog_code,start_date,stop_date,active_status) AS (VALUES
                ('OLD','2026-11-01','2026-11-15','Y'),
                ('NEW','2026-11-16','2026-11-30','Y'),
                ('OVERLAP','2026-11-18','2026-11-20','Y'),
                ('OFF','2026-11-16','2026-11-30','N'),
                ('OTHER','2026-11-16','2026-11-30','Y')),
            catalog_link(catalog_code,cuscode) AS (VALUES
                ('OLD','C1'),('NEW','C1'),('OVERLAP','C1'),('OFF','C1'),('OTHER','C2')),
            catalog_detail(catalog_code,stcode,price) AS (VALUES
                ('OLD','001',10),('NEW','001',20),('OVERLAP','001',30),('OFF','002',99),('OTHER','002',50)),
            items(stcode,stname,unit,vat,packing_weight,typecode,seq) AS (VALUES
                ('001','Vegetable','KG',0,1,'V',1),('002','Other','KG',0,5,'V',2)),
            itemtype(typecode,typename) AS (VALUES ('V','Vegetables')) ";
        return parent::prepare($fixtures . $query, $options);
    }
}
function check($actual, $expected, string $label): void {
    if ($actual !== $expected) throw new RuntimeException($label . ': ' . json_encode($actual));
    echo "PASS $label\n";
}
$db = new CatalogFixture();
check(catalog_items($db, 'C1')[0]['price'], 10, 'Legacy caller uses database today');
foreach (['2026-11-16', '2026-11-30'] as $day) {
    $rows = catalog_items($db, 'C1', $day);
    check(array_column($rows, 'price'), [20], 'Delivery date including boundary ' . $day);
}
check(catalog_items($db, 'C1', '2026-11-15')[0]['price'], 10, 'Old catalog end date inclusive');
check(catalog_items($db, 'C1', '2026-11-19')[0]['price'], 30, 'Latest starting catalog wins overlap');
check(catalog_items($db, 'C1', '2026-12-01'), [], 'No fallback to today when delivery date has no catalog');
check(catalog_items($db, 'C2', '2026-11-16')[0]['price'], 50, 'Customer-specific catalog');
check(catalog_items($db, "C1' OR 1=1 --", '2026-11-16'), [], 'Customer is bound as data');
check(catalog_items($db, 'C1', '2026-11-16', 'Fruit'), [], 'Type filter retained');
check(count(catalog_items($db, 'C1', '2026-11-16', 'vegetables')), 1, 'Type filter case insensitive');
check(packing_resolve($db, 'C1', ['stcode'=>'001','unit'=>'KG','catalog_code'=>'NEW'], '2026-11-16'), '1.00', 'Saving accepts future catalog on delivery date');
try {
    packing_resolve($db, 'C1', ['stcode'=>'001','unit'=>'KG','catalog_code'=>'NEW'], '2026-11-12');
    throw new RuntimeException('Expected catalog rejection');
} catch (Exception $e) {
    if ($e->getMessage() !== 'Selected catalog is no longer valid for this customer. Please select the item again.') throw $e;
    echo "PASS Catalog outside delivery date rejected\n";
}
foreach (['2026-02-30', '16/11/2026', '0000-01-01', '2026-11-16 OR 1=1'] as $invalid) {
    try { catalog_date($invalid); throw new RuntimeException('Accepted invalid date'); }
    catch (InvalidArgumentException $e) { echo "PASS Reject invalid date $invalid\n"; }
}
check(catalog_date('2028-02-29'), '2028-02-29', 'Valid leap date');
