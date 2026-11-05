<?php
/** Preview is read-only. Writers hold one database-scoped lock until commit/rollback.
 * All document creation entry points must use this lock, including AI and packaging.
 */
function lock_document_numbers(PDO $pdo): void {
    static $held = array();
    $id = spl_object_id($pdo);
    if (isset($held[$id])) return;
    $database = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
    $name = 'prevail-doc-' . sha1($database);
    $stmt = $pdo->prepare('SELECT GET_LOCK(:name, 15)');
    $stmt->execute(array('name' => $name));
    if ((int)$stmt->fetchColumn() !== 1) {
        throw new RuntimeException('มีผู้ใช้อื่นกำลังออกเลขเอกสาร กรุณากดบันทึกอีกครั้ง');
    }
    $held[$id] = true;
    // Keep the connection alive until cleanup; never unlock an unfinished write.
    register_shutdown_function(function () use ($pdo, $name) {
        try {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $stmt = $pdo->prepare('SELECT RELEASE_LOCK(:name)');
            $stmt->execute(array('name' => $name));
        } catch (Throwable $e) { error_log('Document number lock cleanup failed'); }
    });
}
function document_number_config(string $kind): array {
    $types = array(
        'pocode' => array('PO', 'pomaster', false),
        'grcode' => array('GR', 'grmaster', false),
        'qtcode' => array('QT', 'qtmaster', true),
        'socode' => array('IV', 'somaster', true),
        'dncode' => array('DN', 'dnmaster', true),
        'blcode' => array('BI', 'bl_master', true),
        'recode' => array('RE', 'receipt', true),
    );
    if (!isset($types[$kind])) throw new InvalidArgumentException('Unknown document type');
    return $types[$kind];
}
function document_number(PDO $pdo, string $kind, bool $allocate = false): string {
    list($prefix, $table, $buddhist) = document_number_config($kind);
    if ($allocate) {
        if (!$pdo->inTransaction()) throw new LogicException('Document allocation requires a transaction');
        lock_document_numbers($pdo);
    }
    $year = date('Y'); $month = date('m');
    $params = array('y' => $year, 'm' => $month);
    $lock = $allocate ? ' FOR UPDATE' : '';
    $stmt = $pdo->prepare("SELECT $kind FROM options WHERE year = :y AND month = :m" . $lock);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (count($rows) > 1) throw new RuntimeException('พบเลขรันซ้ำในเดือนนี้ กรุณาตรวจสอบตาราง options');
    $number = count($rows) ? max(1, (int)$rows[0]) : 1;
    if (!$rows && $allocate) {
        $stmt = $pdo->prepare('INSERT INTO options (year, month) VALUES (:y, :m)');
        $stmt->execute($params);
    }
    $prefix .= substr((string)((int)$year + ($buddhist ? 543 : 0)), -2) . $month;
    // Locking reads see the latest committed rows even under REPEATABLE READ.
    $check = $pdo->prepare("SELECT $kind FROM $table WHERE $kind = :code" . $lock);
    $legacy = $kind === 'socode' ? $pdo->prepare('SELECT dncode FROM dnmaster WHERE dncode = :code' . $lock) : null;
    do {
        $code = $prefix . sprintf('%03d', $number);
        $check->execute(array('code' => $code));
        $exists = $check->fetchColumn() !== false;
        if ($legacy) {
            $legacy->execute(array('code' => $code));
            $exists = $exists || $legacy->fetchColumn() !== false;
        }
        if ($exists) ++$number;
    } while ($exists);
    if ($allocate) {
        $stmt = $pdo->prepare("UPDATE options SET $kind = :next WHERE year = :y AND month = :m");
        $stmt->execute(array_merge($params, array('next' => $number + 1)));
    }
    return $code;
}

function request_pocode($pdo) { return document_number($pdo, 'pocode'); }

function request_grcode($pdo) { return document_number($pdo, 'grcode'); }

function request_qtcode($pdo) { return document_number($pdo, 'qtcode'); }

function request_socode($pdo) { return document_number($pdo, 'socode'); }

function request_dncode($pdo) { return document_number($pdo, 'dncode'); }

function request_blcode($pdo) { return document_number($pdo, 'blcode'); }

function request_recode($pdo) { return document_number($pdo, 'recode'); }

function catalog_document_number(PDO $pdo, bool $allocate = false): string {
    if ($allocate) {
        if (!$pdo->inTransaction()) throw new LogicException('Catalog allocation requires a transaction');
        lock_document_numbers($pdo);
    }
    $lock = $allocate ? ' FOR UPDATE' : '';
    $row = $pdo->query('SELECT id, number FROM catalog_code ORDER BY id DESC LIMIT 1' . $lock)->fetch(PDO::FETCH_ASSOC);
    $number = max(1, (int)($row['number'] ?? 0) + 1);
    $check = $pdo->prepare('SELECT catalog_code FROM catalog_master WHERE catalog_code = :code' . $lock);
    do {
        $code = 'CL' . sprintf('%04d', $number);
        $check->execute(array('code' => $code));
        $exists = $check->fetchColumn() !== false;
        if ($exists) ++$number;
    } while ($exists);
    if ($allocate) {
        if ($row) {
            $stmt = $pdo->prepare('UPDATE catalog_code SET number = :number WHERE id = :id');
            $stmt->execute(array('number' => $number, 'id' => $row['id']));
        } else {
            $stmt = $pdo->prepare('INSERT INTO catalog_code (number) VALUES (:number)');
            $stmt->execute(array('number' => $number));
        }
    }
    return $code;
}

/** Compatibility for first login of a month; recheck under the same writer lock. */
function create_options(PDO $pdo, $year, $month): void {
    lock_document_numbers($pdo);
    $stmt = $pdo->prepare('SELECT year FROM options WHERE year = :y AND month = :m FOR UPDATE');
    $params = array('y' => $year, 'm' => $month);
    $stmt->execute($params);
    if ($stmt->fetchColumn() === false) {
        $stmt = $pdo->prepare('INSERT INTO options (year, month) VALUES (:y, :m)');
        $stmt->execute($params);
    }
}
