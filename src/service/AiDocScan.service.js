import { requestService as api } from "./Request.service";

/* AI อ่านบิล/ใบส่งของ → เติมใบสั่งซื้อ (api/ai/*) */
const API_URL = {
  SCAN: `/ai/scan.php`,
  MATCH: `/ai/match.php`,
  ALIAS: `/ai/alias.php`,
  USAGE: `/ai/usage.php`,
};

const AiDocScanService = () => {
  /* อัปโหลดรูป/PDF ให้ AI อ่าน — ใช้เวลาหลายวินาที จึงไม่ใช้ loading กลางของระบบ */
  const scan = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(API_URL.SCAN, fd, { ignoreLoading: true, timeout: 240000 });
  };

  /* เปลี่ยนผู้ขายแล้วจับคู่สินค้าใหม่ (ไม่อ่านรูปซ้ำ ไม่เสียค่า AI อ่านรูป) */
  const rematch = (scan_id, supcode) =>
    api.post(API_URL.MATCH, { scan_id, supcode }, { ignoreLoading: true, timeout: 120000 });

  /* จำชื่อในบิล คู่กับรหัสสินค้าในระบบ ตามที่ผู้ใช้ยืนยัน */
  const saveAlias = (parm = {}) => api.post(API_URL.ALIAS, parm, { ignoreLoading: true });

  /* สรุปการใช้งานรายเดือน (ใช้วางบิล) */
  const usage = (month) => api.get(`${API_URL.USAGE}?month=${month}`);

  return { scan, rematch, saveAlias, usage };
};

export default AiDocScanService;
