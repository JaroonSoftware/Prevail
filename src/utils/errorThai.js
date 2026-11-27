/* ============================================================================
   แปลง error ทุกหน้าให้เป็นภาษาไทย พร้อมบอกสาเหตุ
   - AxiosInterceptor เรียก describeError() ทุกครั้งที่ API error
     -> ใส่ err.response.data.message เป็นภาษาไทย (หน้าที่แสดง data.message จะได้ภาษาไทยเลย)
     -> จำสาเหตุล่าสุดไว้ 5 วินาที
   - installThaiErrorMessages() ครอบ antd message.error ทั้งระบบ:
     แปลข้อความอังกฤษเดิม ๆ (Request ... fail. / Request error! ฯลฯ) เป็นไทย
     และต่อท้าย "สาเหตุ: ..." จาก API ที่เพิ่ง error
   ============================================================================ */
import { message } from "antd";

const hasThai = (s) => /[฀-๿]/.test(s || "");

const DOC = {
  saleorder: "ใบขายสินค้า", "sale order": "ใบขายสินค้า", "sales order": "ใบขายสินค้า",
  quotation: "ใบเสนอราคา", "delivery note": "ใบส่งของ", deliverynote: "ใบส่งของ",
  "billing note": "ใบวางบิล", billing: "ใบวางบิล", receipt: "ใบเสร็จรับเงิน",
  goodsreceipt: "ใบรับสินค้า", "goods receipt": "ใบรับสินค้า", "purchase order": "ใบสั่งซื้อ", purchaseorder: "ใบสั่งซื้อ",
  catalog: "แคตตาล็อก", estimation: "ใบประเมินราคา", product: "สินค้า", products: "สินค้า", items: "สินค้า", item: "สินค้า",
  customer: "ลูกค้า", customers: "ลูกค้า", supplier: "ผู้ขาย", user: "ผู้ใช้", users: "ผู้ใช้", unit: "หน่วยสินค้า",
  itemtype: "ประเภทสินค้า", county: "เขตขนส่ง", "delivery trip": "เที่ยวรถ", shipping: "การส่งสินค้า", package: "ถุงสินค้า",
};
const docName = (s) => DOC[(s || "").trim().toLowerCase()] || s;

/** แปลข้อความ error อังกฤษแบบเดิมในหน้าเว็บ เป็นภาษาไทย */
export function translateText(text) {
  if (typeof text !== "string" || !text.trim() || hasThai(text)) return text;
  const t = text.trim();
  const fixed = {
    "request error!": "ทำรายการไม่สำเร็จ", "error request": "ทำรายการไม่สำเร็จ", "request fail.": "ทำรายการไม่สำเร็จ",
    "initail failed": "โหลดข้อมูลเริ่มต้นไม่สำเร็จ", "initial failed": "โหลดข้อมูลเริ่มต้นไม่สำเร็จ",
    "token epired": "หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่", "token expired": "หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่",
    "request method fail.": "รูปแบบคำขอไม่ถูกต้อง", "network error": "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
    "file download not found in server": "ไม่พบไฟล์บนเซิร์ฟเวอร์",
  }[t.toLowerCase()];
  if (fixed) return fixed;
  let m;
  if ((m = t.match(/^request (.+?) (fail|failed|error)\.?!?$/i))) return `บันทึก${docName(m[1])}ไม่สำเร็จ`;
  if ((m = t.match(/^get (.+?) (data|code|list)? ?(fail|failed|error)\.?$/i))) return `ดึงข้อมูล${docName(m[1])}ไม่สำเร็จ`;
  if ((m = t.match(/^error getting (?:infomation |information )?(.+?)\.?$/i))) return `ดึงข้อมูล${docName(m[1])}ไม่สำเร็จ`;
  if ((m = t.match(/^(.+?) file upload failed\.?$/i))) return `อัปโหลดไฟล์ ${m[1]} ไม่สำเร็จ`;
  if ((m = t.match(/^delete (.+?) (fail|failed)\.?$/i))) return `ลบ${docName(m[1])}ไม่สำเร็จ`;
  return null; // ไม่รู้จัก -> ให้ผู้เรียกตัดสินใจ
}

/** แปลข้อความ error จากเซิร์ฟเวอร์ (PHP / MySQL) เป็นภาษาไทย */
export function translateServer(raw) {
  if (raw == null) return "";
  let s = String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!s || hasThai(s)) return s;
  let m;
  if ((m = s.match(/Duplicate entry '([^']*)'/i))) return `ข้อมูลซ้ำ: "${m[1].split("-")[0]}" มีอยู่ในระบบแล้ว`;
  if (/foreign key constraint fails/i.test(s)) return /delete|update a parent/i.test(s)
    ? "ลบ/แก้ไขไม่ได้ เพราะข้อมูลนี้ถูกใช้อยู่ในเอกสารอื่น" : "อ้างอิงข้อมูลที่ไม่มีอยู่ในระบบ (เช่น รหัสสินค้า/ลูกค้าไม่ถูกต้อง)";
  if ((m = s.match(/Data too long for column '([^']*)'/i))) return `ข้อมูลยาวเกินกว่าที่ช่อง "${m[1]}" รับได้`;
  if ((m = s.match(/Column '([^']*)' cannot be null/i))) return `ยังไม่ได้กรอกข้อมูลช่อง "${m[1]}"`;
  if ((m = s.match(/Field '([^']*)' doesn't have a default value/i))) return `ยังไม่ได้กรอกข้อมูลช่อง "${m[1]}"`;
  if ((m = s.match(/Incorrect (\w+) value: '([^']*)' for column '([^']*)'/i))) return `รูปแบบข้อมูลช่อง "${m[3]}" ไม่ถูกต้อง ("${m[2]}")`;
  if ((m = s.match(/Out of range value for column '([^']*)'/i))) return `ตัวเลขช่อง "${m[1]}" มากเกินไป`;
  if ((m = s.match(/Unknown column '([^']*)'/i))) return `ฐานข้อมูลยังไม่มีคอลัมน์ "${m[1]}" — ต้องรันไฟล์ SQL อัปเดตก่อน`;
  if ((m = s.match(/Table '([^']*)' doesn't exist/i))) return `ฐานข้อมูลยังไม่มีตาราง "${m[1].split(".").pop()}" — ต้องรันไฟล์ SQL อัปเดตก่อน`;
  if (/Lock wait timeout|Deadlock/i.test(s)) return "มีผู้ใช้อื่นกำลังบันทึกข้อมูลเดียวกันอยู่ กรุณาลองใหม่อีกครั้ง";
  if (/server has gone away|Connection refused|Too many connections|SQLSTATE\[HY000\] \[2002\]/i.test(s)) return "ฐานข้อมูลไม่ตอบสนอง กรุณาลองใหม่ หรือแจ้งผู้ดูแลระบบ";
  if (/Maximum execution time/i.test(s)) return "เซิร์ฟเวอร์ประมวลผลนานเกินกำหนด — ลองลดช่วงวันที่/จำนวนข้อมูล";
  if (/Allowed memory size/i.test(s)) return "ข้อมูลมากเกินกว่าที่เซิร์ฟเวอร์รับได้ — ลองลดช่วงวันที่/จำนวนข้อมูล";
  if (/POST Content-Length|post_max_size|upload_max_filesize/i.test(s)) return "ไฟล์ใหญ่เกินที่เซิร์ฟเวอร์รับได้";
  if (/unauthori[sz]ed|invalid token|expired token|token expire|signature/i.test(s)) return "หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่";
  if ((m = s.match(/(?:Fatal error|Parse error|Uncaught [\w\\]+):?\s*(.{0,160})/i))) return `โปรแกรมฝั่งเซิร์ฟเวอร์ผิดพลาด (${m[1].replace(/^[:\s]+/, "").trim()})`;
  const known = translateText(s);
  if (known) return known;
  return `ข้อผิดพลาดจากระบบ: ${s.slice(0, 200)}`;
}

const STATUS = {
  400: "ข้อมูลที่ส่งไม่ถูกต้อง", 401: "หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่", 403: "ไม่มีสิทธิ์ทำรายการนี้",
  404: "ไม่พบข้อมูลหรือไฟล์บนเซิร์ฟเวอร์", 405: "รูปแบบคำขอไม่ถูกต้อง", 408: "หมดเวลารอเซิร์ฟเวอร์",
  409: "ข้อมูลถูกแก้ไขโดยผู้อื่น หรือขัดแย้งกับข้อมูลเดิม", 413: "ไฟล์หรือข้อมูลใหญ่เกินที่เซิร์ฟเวอร์รับได้",
  422: "ข้อมูลไม่ครบหรือไม่ถูกต้อง", 429: "ทำรายการถี่เกินไป กรุณารอสักครู่",
  500: "เซิร์ฟเวอร์ผิดพลาด", 502: "เซิร์ฟเวอร์ไม่พร้อมใช้งานชั่วคราว", 503: "เซิร์ฟเวอร์ไม่พร้อมใช้งานชั่วคราว", 504: "เซิร์ฟเวอร์ตอบช้าเกินไป",
};

/** สรุปสาเหตุของ axios error เป็นภาษาไทย 1 บรรทัด */
export function describeError(err) {
  if (!err) return "";
  if (err.thaiMessage) return err.thaiMessage;
  if (err.__CANCEL__ || err.code === "ERR_CANCELED") return "";
  const res = err.response;
  if (!res) {
    if (err.code === "ECONNABORTED" || /timeout/i.test(err.message || "")) return "หมดเวลารอเซิร์ฟเวอร์ (อินเทอร์เน็ตช้าหรือหลุด) กรุณาลองใหม่";
    if (typeof navigator !== "undefined" && navigator.onLine === false) return "เครื่องนี้ไม่ได้เชื่อมต่ออินเทอร์เน็ต";
    if (err.response === undefined && err.request) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (ตรวจอินเทอร์เน็ต หรือเซิร์ฟเวอร์ปิดอยู่)";
    const t = translateText(err.message || "");
    return t || translateServer(err.message || "ทำรายการไม่สำเร็จ");
  }
  const d = res.data;
  let serverMsg = "";
  if (d && typeof d === "object" && !(typeof Blob !== "undefined" && d instanceof Blob)) serverMsg = d.message || d.error || d.msg || "";
  else if (typeof d === "string") serverMsg = d;
  const base = STATUS[res.status] || `เซิร์ฟเวอร์ตอบกลับผิดปกติ (รหัส ${res.status})`;
  if (!serverMsg || !String(serverMsg).trim()) return base;
  const tr = translateServer(serverMsg);
  return tr.startsWith("ข้อผิดพลาดจากระบบ") ? `${base} — ${tr}` : tr;
}

/* ---------- จำสาเหตุล่าสุด ---------- */
let last = null;
export function rememberError(err) {
  const text = describeError(err);
  if (!text) return;
  last = { text, at: Date.now() };
  try {
    err.thaiMessage = text;
    const res = err.response;
    if (res) {
      if (res.data && typeof res.data === "object" && !(typeof Blob !== "undefined" && res.data instanceof Blob)) {
        res.data.message_raw = res.data.message;
        res.data.message = text;
      } else if (!(typeof Blob !== "undefined" && res.data instanceof Blob)) {
        res.data = { status: "0", message: text, message_raw: res.data };
      }
    }
  } catch (e) { /* ignore */ }
}

/* ---------- ครอบ message.error ทั้งระบบ ---------- */
let installed = false;
export function installThaiErrorMessages() {
  if (installed) return;
  installed = true;
  const orig = message.error.bind(message);
  message.error = (content, ...rest) => {
    const isObj = content && typeof content === "object" && !Array.isArray(content) && !content.$$typeof;
    let text = isObj ? content.content : content;
    if (typeof text === "string") {
      const tr = translateText(text);
      if (tr) text = tr;
      else if (!hasThai(text) && text.trim()) text = translateServer(text);
      const recent = last && Date.now() - last.at < 5000 ? last.text : "";
      if (recent && !text.includes(recent) && text !== recent) text = `${text} — สาเหตุ: ${recent}`;
      last = null;
      const dur = Math.max(isObj && content.duration ? content.duration : 0, 6);
      return orig(isObj ? { ...content, content: text, duration: dur } : { content: text, duration: dur }, ...rest);
    }
    return orig(content, ...rest);
  };
}
