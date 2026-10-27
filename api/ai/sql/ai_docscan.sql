/* ============================================================
   Prevail — AI อ่านใบส่งของ/บิลจากรูป แล้วเติมใบสั่งซื้อให้อัตโนมัติ
   2026-10-17

   ให้ผู้ดูแลรันไฟล์นี้เองครั้งเดียวก่อนเปิดใช้ (phpMyAdmin > ฐานข้อมูล prevailw_db > SQL)
   สร้างเฉพาะตารางใหม่ 4 ตาราง ไม่แตะตารางเดิม รันซ้ำได้
   ============================================================ */

/* ทุกครั้งที่สแกน 1 ใบ = 1 แถว เก็บผลที่ AI อ่านได้คู่กับไฟล์ต้นฉบับ
   ใช้ตรวจย้อนหลังเวลาตัวเลขไม่ตรง และใช้วัดความแม่นยำ */
CREATE TABLE IF NOT EXISTS `ai_docscan` (
  `scan_id`        BIGINT(20) NOT NULL AUTO_INCREMENT,
  `created_date`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by`     VARCHAR(100) DEFAULT NULL,
  /* path นับจากโฟลเดอร์โปรเจ็กต์ เช่น uploads/ai-docscan/2026/10/xxxx.jpg */
  `file_path`      VARCHAR(255) DEFAULT NULL,
  /* ชื่อไฟล์เดิมจากเครื่องผู้ใช้ */
  `file_name`      VARCHAR(255) DEFAULT NULL,
  `mime`           VARCHAR(50) DEFAULT NULL,
  `model`          VARCHAR(80) DEFAULT NULL,
  /* processing / ok / error / mock */
  `status`         VARCHAR(20) NOT NULL DEFAULT 'processing',
  `supcode`        VARCHAR(50) DEFAULT NULL,
  `document_no`    VARCHAR(100) DEFAULT NULL,
  /* ผลที่อ่านได้ทั้งใบ (JSON) */
  `extracted_json` MEDIUMTEXT,
  `error_message`  VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`scan_id`),
  KEY `ix_created` (`created_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* บันทึกการเรียก AI ทุกครั้ง — ใช้วางบิลลูกค้ารายเดือน และไล่ปัญหา */
CREATE TABLE IF NOT EXISTS `ai_usage_log` (
  `log_id`         BIGINT(20) NOT NULL AUTO_INCREMENT,
  `created_date`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by`     VARCHAR(100) DEFAULT NULL,
  /* po_docscan = อ่านรูปใบส่งของ , po_match = AI ช่วยจับคู่ชื่อสินค้า */
  `feature`        VARCHAR(50) NOT NULL,
  `model`          VARCHAR(80) NOT NULL,
  `input_tokens`   INT(11) NOT NULL DEFAULT 0,
  `output_tokens`  INT(11) NOT NULL DEFAULT 0,
  /* คำนวณจากราคาที่ตั้งไว้ใน api/ai/.env.ai — เป็นค่าประมาณ ยอดจริงดูที่ Claude Console */
  `cost_usd`       DECIMAL(12,6) NOT NULL DEFAULT 0,
  `duration_ms`    INT(11) NOT NULL DEFAULT 0,
  /* ok / error / mock */
  `status`         VARCHAR(20) NOT NULL,
  `error_message`  VARCHAR(500) DEFAULT NULL,
  `request_id`     VARCHAR(100) DEFAULT NULL,
  /* Workspace ใน Claude Console ที่ถูกคิดเงิน — ใช้ยืนยันว่าลงบิลถูกลูกค้า */
  `workspace_id`   VARCHAR(100) DEFAULT NULL,
  `scan_id`        BIGINT(20) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `ix_created` (`created_date`),
  KEY `ix_feature` (`feature`, `created_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ชื่อสินค้าที่ผู้ขายพิมพ์ในใบส่งของ -> รหัสสินค้าในระบบ
   ระบบจำให้เองตอนผู้ใช้ยืนยันการจับคู่ ครั้งหน้าเจอชื่อเดิมจะจับคู่ได้ทันที */
CREATE TABLE IF NOT EXISTS `ai_item_alias` (
  `alias_id`       INT(11) NOT NULL AUTO_INCREMENT,
  `supcode`        VARCHAR(50) NOT NULL,
  `raw_text`       VARCHAR(500) NOT NULL,
  /* raw_text ที่ตัดช่องว่าง/เครื่องหมาย/ตัวพิมพ์ใหญ่เล็กออกแล้ว */
  `raw_norm`       VARCHAR(500) NOT NULL,
  /* SHA-1 ของ raw_norm — ใช้ค้นหาและกันซ้ำ (ไม่ทำ index บนข้อความยาวโดยตรง) */
  `raw_hash`       CHAR(40) NOT NULL,
  `stcode`         VARCHAR(50) NOT NULL,
  `hit_count`      INT(11) NOT NULL DEFAULT 1,
  `created_date`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by`     VARCHAR(100) DEFAULT NULL,
  `updated_date`   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`alias_id`),
  UNIQUE KEY `uq_sup_raw` (`supcode`, `raw_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ชื่อผู้ขายตามที่พิมพ์บนหัวใบส่งของ -> รหัสผู้ขายในระบบ */
CREATE TABLE IF NOT EXISTS `ai_supplier_alias` (
  `alias_id`       INT(11) NOT NULL AUTO_INCREMENT,
  `raw_text`       VARCHAR(500) NOT NULL,
  `raw_norm`       VARCHAR(500) NOT NULL,
  `raw_hash`       CHAR(40) NOT NULL,
  `supcode`        VARCHAR(50) NOT NULL,
  `hit_count`      INT(11) NOT NULL DEFAULT 1,
  `created_date`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by`     VARCHAR(100) DEFAULT NULL,
  `updated_date`   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`alias_id`),
  UNIQUE KEY `uq_raw` (`raw_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
