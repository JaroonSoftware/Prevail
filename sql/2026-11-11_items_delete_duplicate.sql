/* ============================================================================
   ลบสินค้าที่ "ชื่อไทย (stname) ตรงกันทุกตัวอักษร" และยังไม่เคยออกใบขาย
   รันใน phpMyAdmin ทั้งไฟล์

   ขั้นตอน
     1) รันครั้งแรกตามนี้ (@apply_changes = 0) -> ดูพรีวิวเท่านั้น ยังไม่ลบ
     2) ตรวจรายการ "จะลบ" ให้ถูกต้อง  แนะนำ export/backup ตาราง items ก่อน
     3) แก้บรรทัดล่างเป็น  SET @apply_changes = 1;  แล้วรันอีกครั้ง -> ลบจริง

   กติกา (ต่อชื่อที่ซ้ำ 1 กลุ่ม)
     - ชื่อเทียบแบบตรงกันเท่านั้น (ตัดช่องว่างหัว-ท้ายอย่างเดียว)
     - ตัวที่มีในใบขาย (sodetail) = เก็บไว้ทั้งหมด
     - ถ้าทั้งกลุ่มไม่เคยออกใบขายเลย = เก็บตัวรหัสน้อยสุดไว้ 1 ตัว
     - เพื่อความปลอดภัย ไม่ลบตัวที่ยังถูกใช้ใน: ใบเสนอราคา, ใบสั่งซื้อ, ใบรับของ,
       ใบส่งของ, bl_detail, แคตตาล็อก, barcode หน้าถุง  (จะแสดงเป็น "ข้าม" ในพรีวิว)
     - ตัวที่ใช้เฉพาะในแคตตาล็อก = ลบได้ ("จะลบ (ย้ายแคตตาล็อก)") บรรทัดแคตตาล็อกย้ายไปเป็นรหัสที่เก็บ
       ถ้าแคตตาล็อกนั้นมีรหัสที่เก็บอยู่แล้ว จะลบบรรทัดซ้ำทิ้ง (ใช้ราคาของรหัสที่เก็บ)
     - ลบพร้อมข้อมูลประกอบ: items_alias, ai_item_alias, supplier_items, items_stock
   ============================================================================ */

SET @apply_changes = 0;   -- 0 = พรีวิว, 1 = ลบจริง

/* ---------- ตารางช่วย (ตารางจริง ลบทิ้งตอนท้าย) ---------- */
DROP TABLE IF EXISTS `prevailw_db`.`tmp_dup_items`;
CREATE TABLE `prevailw_db`.`tmp_dup_items` (
    stcode   VARCHAR(50) NOT NULL PRIMARY KEY,
    nkey     VARCHAR(255) NOT NULL,
    so_lines INT NOT NULL DEFAULT 0,
    other_use INT NOT NULL DEFAULT 0,
    used_in  VARCHAR(500) NULL,
    c0 INT NOT NULL DEFAULT 0,
    c1 INT NOT NULL DEFAULT 0,
    c2 INT NOT NULL DEFAULT 0,
    c3 INT NOT NULL DEFAULT 0,
    c4 INT NOT NULL DEFAULT 0,
    c5 INT NOT NULL DEFAULT 0,
    c6 INT NOT NULL DEFAULT 0,
    keep_code VARCHAR(50) NULL,
    action   VARCHAR(100) NULL,
    KEY ix_nkey (nkey)
) DEFAULT CHARSET = utf8mb4;

/* สินค้าทุกตัวที่ชื่อซ้ำกับตัวอื่น */
INSERT INTO `prevailw_db`.`tmp_dup_items` (stcode, nkey)
SELECT i.stcode, TRIM(i.stname)
FROM `prevailw_db`.`items` i
WHERE TRIM(i.stname) IN (
    SELECT n FROM (SELECT TRIM(stname) n FROM `prevailw_db`.`items`
                   WHERE TRIM(COALESCE(stname, '')) <> ''
                   GROUP BY TRIM(stname) HAVING COUNT(*) > 1) g
);

/* จำนวนบรรทัดในใบขาย */
UPDATE `prevailw_db`.`tmp_dup_items` t
SET so_lines = (SELECT COUNT(*) FROM `prevailw_db`.`sodetail` s WHERE s.stcode = t.stcode);

/* ถูกใช้ในเอกสาร/ข้อมูลอื่น — นับแยกตามระบบ */
UPDATE `prevailw_db`.`tmp_dup_items` t SET
    c0 = (SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = t.stcode),
    c1 = (SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = t.stcode),
    c2 = (SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = t.stcode),
    c3 = (SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = t.stcode),
    c4 = (SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = t.stcode),
    c5 = (SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = t.stcode),
    c6 = (SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = t.stcode);

UPDATE `prevailw_db`.`tmp_dup_items` SET
    other_use = c0 + c1 + c2 + c3 + c4 + c5 + c6,
    used_in = CONCAT_WS(', ',
        IF(c0 > 0, CONCAT('ใบเสนอราคา ', c0), NULL),
        IF(c1 > 0, CONCAT('ใบสั่งซื้อ ', c1), NULL),
        IF(c2 > 0, CONCAT('ใบรับของ ', c2), NULL),
        IF(c3 > 0, CONCAT('ใบส่งของ ', c3), NULL),
        IF(c4 > 0, CONCAT('bl_detail ', c4), NULL),
        IF(c5 > 0, CONCAT('แคตตาล็อก ', c5), NULL),
        IF(c6 > 0, CONCAT('barcode หน้าถุง ', c6), NULL));

/* ตัวที่เก็บไว้ของแต่ละกลุ่ม: ถ้ามีตัวที่ออกใบขายแล้ว ใช้ตัวนั้น (ใช้มากสุด) ไม่งั้นรหัสน้อยสุด */
UPDATE `prevailw_db`.`tmp_dup_items` t
SET keep_code = (
    SELECT k.stcode FROM (SELECT stcode, nkey, so_lines FROM `prevailw_db`.`tmp_dup_items`) k
    WHERE k.nkey = t.nkey
    ORDER BY k.so_lines DESC, k.stcode
    LIMIT 1
);

UPDATE `prevailw_db`.`tmp_dup_items`
SET action = CASE
    WHEN so_lines > 0 OR stcode = keep_code THEN 'เก็บไว้'
    WHEN other_use > 0 AND other_use = c5 THEN 'จะลบ (ย้ายแคตตาล็อก)'
    WHEN other_use > 0 THEN 'ข้าม (ใช้ที่อื่น)'
    ELSE 'จะลบ'
END;

/* ---------- พรีวิว ---------- */
SELECT t.nkey AS `ชื่อสินค้า`, t.stcode AS `รหัส`, i.stnameEN AS `ชื่ออังกฤษ`, i.active_status AS `สถานะ`,
       t.so_lines AS `บรรทัดใบขาย`, t.used_in AS `ใช้ที่ระบบ (จำนวนแถว)`, t.keep_code AS `รหัสที่เก็บ`, t.action AS `ผล`
FROM `prevailw_db`.`tmp_dup_items` t
JOIN `prevailw_db`.`items` i ON i.stcode = t.stcode
ORDER BY t.nkey, t.action, t.stcode;

SELECT action AS `ผล`, COUNT(*) AS `จำนวน` FROM `prevailw_db`.`tmp_dup_items` GROUP BY action;

/* ---------- ลบจริง (ทำเมื่อ @apply_changes = 1 เท่านั้น) ---------- */
/* ตัวที่ใช้เฉพาะในแคตตาล็อก: ย้ายบรรทัดแคตตาล็อกไปเป็นรหัสที่เก็บ
   ถ้าแคตตาล็อกนั้นมีรหัสที่เก็บอยู่แล้ว -> ลบบรรทัดของรหัสที่จะลบทิ้ง (ราคาของรหัสที่เก็บยังอยู่) */
DROP TABLE IF EXISTS `prevailw_db`.`tmp_dup_catkeep`;
CREATE TABLE `prevailw_db`.`tmp_dup_catkeep` (catalog_code VARCHAR(50), stcode VARCHAR(50), KEY ix (catalog_code, stcode)) DEFAULT CHARSET = utf8mb4;
INSERT INTO `prevailw_db`.`tmp_dup_catkeep`
SELECT DISTINCT d.catalog_code, d.stcode FROM `prevailw_db`.`catalog_detail` d
WHERE d.stcode IN (SELECT keep_code FROM `prevailw_db`.`tmp_dup_items` WHERE action = 'จะลบ (ย้ายแคตตาล็อก)');

DELETE d FROM `prevailw_db`.`catalog_detail` d
JOIN `prevailw_db`.`tmp_dup_items` t ON t.stcode = d.stcode AND t.action = 'จะลบ (ย้ายแคตตาล็อก)'
JOIN `prevailw_db`.`tmp_dup_catkeep` k ON k.catalog_code = d.catalog_code AND k.stcode = t.keep_code
WHERE @apply_changes = 1;

UPDATE `prevailw_db`.`catalog_detail` d
JOIN `prevailw_db`.`tmp_dup_items` t ON t.stcode = d.stcode AND t.action = 'จะลบ (ย้ายแคตตาล็อก)'
SET d.stcode = t.keep_code
WHERE @apply_changes = 1;

DROP TABLE IF EXISTS `prevailw_db`.`tmp_dup_catkeep`;

DELETE FROM `prevailw_db`.`items_alias`
WHERE @apply_changes = 1 AND stcode IN (SELECT stcode FROM `prevailw_db`.`tmp_dup_items` WHERE action LIKE 'จะลบ%');
DELETE FROM `prevailw_db`.`ai_item_alias`
WHERE @apply_changes = 1 AND stcode IN (SELECT stcode FROM `prevailw_db`.`tmp_dup_items` WHERE action LIKE 'จะลบ%');
DELETE FROM `prevailw_db`.`supplier_items`
WHERE @apply_changes = 1 AND stcode IN (SELECT stcode FROM `prevailw_db`.`tmp_dup_items` WHERE action LIKE 'จะลบ%');
DELETE FROM `prevailw_db`.`items_stock`
WHERE @apply_changes = 1 AND stcode IN (SELECT stcode FROM `prevailw_db`.`tmp_dup_items` WHERE action LIKE 'จะลบ%');
DELETE FROM `prevailw_db`.`items`
WHERE @apply_changes = 1 AND stcode IN (SELECT stcode FROM `prevailw_db`.`tmp_dup_items` WHERE action LIKE 'จะลบ%');

SELECT IF(@apply_changes = 1, 'ลบเรียบร้อย', 'พรีวิวเท่านั้น — ยังไม่ได้ลบ') AS `สถานะการรัน`;

DROP TABLE IF EXISTS `prevailw_db`.`tmp_dup_items`;
