<?php

// Omitted dates keep the legacy database-today behaviour for other screens.
function catalog_date($value): ?string {
    if ($value === null || $value === '') return null;
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
        throw new InvalidArgumentException('วันที่นัดส่งสินค้าไม่ถูกต้อง');
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value || substr($value, 0, 4) === '0000') {
        throw new InvalidArgumentException('วันที่นัดส่งสินค้าไม่ถูกต้อง');
    }
    return $value;
}
