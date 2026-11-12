/* ============================================================================
   รายงานสินค้าที่น่าจะกรอกซ้ำ — อ่านอย่างเดียว ไม่แก้ข้อมูล
   รันใน phpMyAdmin ได้ทั้งไฟล์ (ผลแสดง 2 ตาราง)

   ตาราง 1: ชื่อไทยเหมือนกันเมื่อไม่สนช่องว่าง/เครื่องหมาย  เช่น "หอมหัวใหญ่" = "หอม หัวใหญ่"
   ตาราง 2: ชื่อหนึ่งอยู่ในอีกชื่อ                         เช่น "หอมใหญ่" อยู่ใน "หอมใหญ่ปอก"
            (ตารางนี้คือ "น่าจะ" ซ้ำ ต้องดูด้วยตา เพราะอาจเป็นคนละเกรด/ขนาด)

   คอลัมน์ so_lines = จำนวนบรรทัดในใบขายที่ใช้รหัสนี้
     0 = ยังไม่เคยเอาไปทำใบขาย
   คอลัมน์ ใช้ที่ระบบอื่น = ใบเสนอราคา/ใบสั่งซื้อ/ใบรับของ/ใบส่งของ/bl_detail/แคตตาล็อก/barcode หน้าถุง  ("-" = ไม่มี) -> ลบ/ปิดการใช้งาน/รวม ได้ง่าย
   แสดงเฉพาะสินค้าที่เปิดใช้งาน และเฉพาะกลุ่มที่มีอย่างน้อย 1 ตัวที่ยังไม่เคยขาย
   ============================================================================ */

/* ---------- ตาราง 1: ชื่อซ้ำ (ไม่สนช่องว่าง/เครื่องหมาย) ---------- */
SELECT n.nkey AS `กลุ่มชื่อ`,
       i.stcode AS `รหัส`, i.stname AS `ชื่อไทย`, i.stnameEN AS `ชื่ออังกฤษ`,
       COALESCE(s.cnt, 0) AS so_lines,
       IF(s.cnt IS NULL, 'ยังไม่เคยขาย', 'ใช้ในใบขายแล้ว') AS `สถานะ`,
       COALESCE(NULLIF(CONCAT_WS(', ',
           IF((SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = i.stcode) > 0, CONCAT('ใบเสนอราคา ', (SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = i.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = i.stcode) > 0, CONCAT('ใบสั่งซื้อ ', (SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = i.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = i.stcode) > 0, CONCAT('ใบรับของ ', (SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = i.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = i.stcode) > 0, CONCAT('ใบส่งของ ', (SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = i.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = i.stcode) > 0, CONCAT('bl_detail ', (SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = i.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = i.stcode) > 0, CONCAT('แคตตาล็อก ', (SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = i.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = i.stcode) > 0, CONCAT('barcode หน้าถุง ', (SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = i.stcode)), NULL)), ''), '-') AS `ใช้ที่ระบบอื่น (จำนวนแถว)`
FROM (
    SELECT stcode,
           LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(stname),
                 ' ', ''), '/', ''), '-', ''), '.', ''), '(', ''), ')', ''), ',', ''), '_', '')) AS nkey
    FROM `prevailw_db`.`items`
    WHERE active_status = 'Y'
) n
JOIN `prevailw_db`.`items` i ON i.stcode = n.stcode
LEFT JOIN (SELECT stcode, COUNT(*) cnt FROM `prevailw_db`.`sodetail` GROUP BY stcode) s ON s.stcode = n.stcode
WHERE n.nkey IN (
    SELECT k.nkey FROM (
        SELECT LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(x.stname),
                 ' ', ''), '/', ''), '-', ''), '.', ''), '(', ''), ')', ''), ',', ''), '_', '')) AS nkey,
               x.stcode
        FROM `prevailw_db`.`items` x WHERE x.active_status = 'Y'
    ) k
    LEFT JOIN (SELECT stcode, COUNT(*) cnt FROM `prevailw_db`.`sodetail` GROUP BY stcode) u ON u.stcode = k.stcode
    GROUP BY k.nkey
    HAVING COUNT(*) > 1 AND SUM(u.cnt IS NULL) > 0
)
ORDER BY n.nkey, so_lines DESC, i.stcode;

/* ---------- ตาราง 2: ชื่อหนึ่งอยู่ในอีกชื่อ (ชื่อสั้นอย่างน้อย 4 ตัวอักษร) ---------- */
SELECT a.stcode AS `รหัส (ชื่อสั้น)`, a.stname AS `ชื่อสั้น`, COALESCE(sa.cnt, 0) AS `so_lines_สั้น`,
       COALESCE(NULLIF(CONCAT_WS(', ',
           IF((SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = a.stcode) > 0, CONCAT('ใบเสนอราคา ', (SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = a.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = a.stcode) > 0, CONCAT('ใบสั่งซื้อ ', (SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = a.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = a.stcode) > 0, CONCAT('ใบรับของ ', (SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = a.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = a.stcode) > 0, CONCAT('ใบส่งของ ', (SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = a.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = a.stcode) > 0, CONCAT('bl_detail ', (SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = a.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = a.stcode) > 0, CONCAT('แคตตาล็อก ', (SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = a.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = a.stcode) > 0, CONCAT('barcode หน้าถุง ', (SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = a.stcode)), NULL)), ''), '-') AS `ใช้ที่ระบบอื่น_สั้น`,
       b.stcode AS `รหัส (ชื่อยาว)`, b.stname AS `ชื่อยาว`, COALESCE(sb.cnt, 0) AS `so_lines_ยาว`,
       COALESCE(NULLIF(CONCAT_WS(', ',
           IF((SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = b.stcode) > 0, CONCAT('ใบเสนอราคา ', (SELECT COUNT(*) FROM `prevailw_db`.`qtdetail` x WHERE x.stcode = b.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = b.stcode) > 0, CONCAT('ใบสั่งซื้อ ', (SELECT COUNT(*) FROM `prevailw_db`.`podetail` x WHERE x.stcode = b.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = b.stcode) > 0, CONCAT('ใบรับของ ', (SELECT COUNT(*) FROM `prevailw_db`.`grdetail` x WHERE x.stcode = b.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = b.stcode) > 0, CONCAT('ใบส่งของ ', (SELECT COUNT(*) FROM `prevailw_db`.`dndetail` x WHERE x.stcode = b.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = b.stcode) > 0, CONCAT('bl_detail ', (SELECT COUNT(*) FROM `prevailw_db`.`bl_detail` x WHERE x.stcode = b.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = b.stcode) > 0, CONCAT('แคตตาล็อก ', (SELECT COUNT(*) FROM `prevailw_db`.`catalog_detail` x WHERE x.stcode = b.stcode)), NULL),
           IF((SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = b.stcode) > 0, CONCAT('barcode หน้าถุง ', (SELECT COUNT(*) FROM `prevailw_db`.`package_barcode` x WHERE x.stcode = b.stcode)), NULL)), ''), '-') AS `ใช้ที่ระบบอื่น_ยาว`
FROM (
    SELECT stcode, stname, REPLACE(REPLACE(LOWER(TRIM(stname)), ' ', ''), '/', '') AS nk
    FROM `prevailw_db`.`items` WHERE active_status = 'Y'
) a
JOIN (
    SELECT stcode, stname, REPLACE(REPLACE(LOWER(TRIM(stname)), ' ', ''), '/', '') AS nk
    FROM `prevailw_db`.`items` WHERE active_status = 'Y'
) b ON b.stcode <> a.stcode AND b.nk <> a.nk AND CHAR_LENGTH(a.nk) >= 4
       AND b.nk LIKE CONCAT('%', a.nk, '%')
LEFT JOIN (SELECT stcode, COUNT(*) cnt FROM `prevailw_db`.`sodetail` GROUP BY stcode) sa ON sa.stcode = a.stcode
LEFT JOIN (SELECT stcode, COUNT(*) cnt FROM `prevailw_db`.`sodetail` GROUP BY stcode) sb ON sb.stcode = b.stcode
WHERE sa.cnt IS NULL OR sb.cnt IS NULL
ORDER BY a.nk, b.nk;
