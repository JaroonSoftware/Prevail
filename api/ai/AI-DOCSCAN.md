# AI อ่านบิล / ใบส่งของ → ใบสั่งซื้อ (Prevail)

สถานะ: **ทดสอบ** — เมนู BUY > "ใบสั่งซื้ออ่านค่าจาก AI (ทดสอบ)" (`/ai-purchase-order`)
ซ่อนจากพนักงานขายและพนักงานส่งสินค้า เหมือนเมนูใบสั่งซื้อ

## ทำงานอย่างไร

1. ผู้ใช้ถ่ายรูป/อัปโหลด PDF บิล ใบส่งของ หรือใบกำกับภาษีของผู้ขาย → `api/ai/scan.php`
2. Claude อ่านเอกสาร → ผู้ขาย เลขที่/วันที่ รายการ จำนวน หน่วย ราคา ส่วนลด
3. ระบบจับคู่ผู้ขาย (เลขผู้เสียภาษี → ชื่อที่เคยจำไว้ → ชื่อใกล้เคียง)
   และจับคู่สินค้ากับ **ทะเบียนสินค้า** (items ที่เปิดใช้งาน)
   สินค้าที่ผูกกับผู้ขายรายนั้น (ข้อมูลผู้ขาย > รายการสินค้า) ได้สิทธิ์ก่อนเมื่อชื่อใกล้กัน
4. ผู้ใช้ตรวจ/แก้ในหน้า AI → กด "สร้างใบสั่งซื้อ"
   → ไปหน้าสร้างใบสั่งซื้อเดิม พร้อมผู้ขาย วันที่ รายการ ราคา ส่วนลด และ Remark
5. **หน้า AI ไม่บันทึกเอง** — ใบสั่งซื้อของ Prevail ตัดเข้าสต๊อกทันทีที่กดบันทึก
   ผู้ใช้ต้องตรวจและกดบันทึกที่หน้าใบสั่งซื้อเอง
6. คู่ชื่อที่ผู้ใช้ยืนยันถูกจำไว้ (`ai_item_alias`, `ai_supplier_alias`) ครั้งหน้าจับคู่ได้ทันที

สินค้าเดียวกันหลายแถวในบิล จะรวมเป็นบรรทัดเดียว (จำนวนรวม ราคาเฉลี่ย ส่วนลดเป็น %)
เพราะฟอร์มใบสั่งซื้อรับได้สินค้าละ 1 บรรทัด

## ติดตั้ง

1. **ให้ผู้ดูแลรัน SQL เอง**: `api/ai/sql/ai_docscan.sql`
   (phpMyAdmin > prevailw_db > SQL) สร้าง 4 ตารางใหม่ ไม่แตะตารางเดิม รันซ้ำได้
2. สร้างไฟล์ `api/ai/.env.ai` เอง (Notepad) แล้ววางเนื้อหาจากหัวข้อ **แม่แบบ .env.ai** ด้านล่าง
   (อยู่ใน .gitignore และ .htaccess กันเปิดจากเว็บแล้ว — ห้ามส่ง key ทางแชต)
3. ทดลองก่อนด้วย `AI_MOCK=1` — ไม่เรียก Claude ไม่เสียเงิน
   ระบบสร้างบิลปลอมจากผู้ขายและสินค้าจริงในฐานข้อมูล
4. ใช้งานจริง: ใส่ `ANTHROPIC_API_KEY` ของ Workspace "Prevail" แล้วตั้ง `AI_MOCK=0`

## XAMPP / PHP ที่ต้องเช็ก

- `php.ini`: เปิด `extension=curl` และ `extension=gd` (gd ใช้ย่อรูป ถ้าไม่มีก็ยังทำงาน)
- `upload_max_filesize = 10M`, `post_max_size = 12M` ขึ้นไป
- `max_execution_time = 180`
- ถ้าเจอ error เรื่อง SSL certificate ให้ตั้ง `AI_CA_BUNDLE=C:/xampp/apache/bin/curl-ca-bundle.crt`
- แก้ php.ini แล้วต้อง restart Apache
- โฟลเดอร์ `uploads/` ต้องเขียนได้ (รูปเก็บที่ `uploads/ai-docscan/ปี/เดือน/` มี .htaccess กันเปิดตรง)

## แยก Key ต่อลูกค้า (เพื่อวางบิล)

ใน Claude Console: **Settings → Workspaces → Create** ชื่อ `Prevail`
→ สร้าง API Key ใน Workspace นี้ → ใส่ใน `.env.ai` → ตั้ง **Spend limit** รายเดือน
สิ้นเดือนดูยอดจริงที่ **Usage / Cost** แยกตาม Workspace

ข้อมูลประกอบในระบบ:

- `GET api/ai/usage.php?month=2026-10` → จำนวนครั้งที่สแกน tokens ค่าประมาณ (USD)
- ตาราง `ai_usage_log` (feature `po_docscan` = อ่านรูป, `po_match` = AI ช่วยจับคู่ชื่อ)

## ไฟล์

- `api/ai/scan.php` `match.php` `alias.php` `usage.php` และ `api/ai/lib/*`
- `api/ai/sql/ai_docscan.sql` — SQL ให้ผู้ดูแลรันเอง
- `src/pages/purchase-order/AiDocScan.jsx` — หน้าจอ
- `src/service/AiDocScan.service.js` — เรียก API
- แก้ไฟล์เดิม (เพิ่มอย่างเดียว): `src/nav.js` (เมนู), `src/route/warehouse.router.js` (route),
  `src/pages/purchase-order/index.js`, `src/pages/purchase-order/MyManage.jsx` (บล็อก `AI` รับข้อมูลมาเติมฟอร์ม), `.gitignore`

## ขึ้นเซิร์ฟเวอร์จริง

`npm run build` แล้วอัปขึ้น server พร้อมโฟลเดอร์ `api/ai`, รัน SQL ที่ server และสร้าง `.env.ai` ที่ server

## แม่แบบ .env.ai

```ini
# ============================================================
#  AI DocScan — ค่าตั้งของลูกค้ารายนี้
#  คัดลอกไฟล์นี้เป็น  api/ai/.env.ai  แล้วใส่ค่าจริง
#  .env.ai ไม่ขึ้น git และเปิดผ่านเว็บไม่ได้ (กันไว้ใน .htaccess)
# ============================================================

# ปิด/เปิดฟีเจอร์ทั้งหมด (0 = ปิด)
AI_ENABLED=1

# 1 = โหมดจำลอง ไม่เรียก AI จริง ไม่เสียเงิน
#     สร้างบิลปลอมจากผู้ขายและสินค้าในฐานข้อมูลจริง ใช้ทดสอบทั้ง flow ได้
AI_MOCK=1

# API key ของ "Workspace ลูกค้ารายนี้" ใน Claude Console
# แนะนำ: สร้าง 1 Workspace ต่อ 1 ลูกค้า แล้วออก key ใน Workspace นั้น
#        จะเห็นยอดใช้จ่ายแยกรายลูกค้า + ตั้งเพดานค่าใช้จ่ายรายเดือนได้
ANTHROPIC_API_KEY=

# รุ่นที่ใช้อ่านรูปใบส่งของ (ต้องอ่านภาษาไทยจากรูปได้แม่น)
AI_MODEL=claude-sonnet-5-5

# รุ่นที่ใช้ช่วยจับคู่ชื่อสินค้า (งานข้อความล้วน ใช้รุ่นถูกได้)
AI_MATCH_MODEL=claude-haiku-5-5

# 1 = ให้ AI ช่วยจับคู่ชื่อสินค้าที่ระบบจับคู่เองไม่มั่นใจ (เสียเพิ่มเล็กน้อย)
AI_SEMANTIC_MATCH=1

# ขนาดไฟล์สูงสุดที่รับ (MB) และเวลารอ AI สูงสุด (วินาที)
AI_MAX_UPLOAD_MB=10
AI_TIMEOUT_SEC=90

# ราคา USD ต่อ 1 ล้าน token — ใช้คำนวณค่าใช้จ่ายใน ai_usage_log เท่านั้น
# ตรวจราคาล่าสุดที่ https://platform.claude.com/docs/en/about-claude/pricing
AI_PRICE_IN=2
AI_PRICE_OUT=10
AI_MATCH_PRICE_IN=0.10
AI_MATCH_PRICE_OUT=0.50

# XAMPP บน Windows มักเจอ "SSL certificate problem: unable to get local issuer certificate"
# ถ้าเจอ ให้ชี้ไปที่ไฟล์ CA ที่มากับ XAMPP เช่น
# AI_CA_BUNDLE=C:/xampp/apache/bin/curl-ca-bundle.crt
AI_CA_BUNDLE=
```
