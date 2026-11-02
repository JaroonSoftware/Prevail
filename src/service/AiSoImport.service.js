import { requestService as api } from "./Request.service";

/* PO ลูกค้า -> ร่างใบขายสินค้า (สถานะ "รอยืนยัน") ด้วย AI  (api/ai/so-*.php) */
const API_URL = {
  IMPORT: `/ai/so-import.php`,
  PENDING: `/ai/so-pending.php`,
  CONFIRM: `/ai/so-confirm.php`,
};

const AiSoImportService = () => {
  /* อัปโหลด PO ให้ AI อ่าน — PDF หลายหน้าใช้เวลาหลายนาที จึงไม่ใช้ loading กลางของระบบ */
  const importFile = (file, cuscode) => {
    const fd = new FormData();
    fd.append("file", file);
    if (cuscode) fd.append("cuscode", cuscode);
    return api.post(API_URL.IMPORT, fd, { ignoreLoading: true, timeout: 660000 });
  };

  /* หาลูกค้าไม่เจอ -> ผู้ใช้เลือกเอง แล้วสร้างจากผลที่อ่านไว้ (ไม่อ่านไฟล์ซ้ำ) */
  const importWithCustomer = (import_id, cuscode) =>
    api.post(API_URL.IMPORT, { import_id, cuscode }, { ignoreLoading: true, timeout: 180000 });

  const pending = (socode) => api.get(`${API_URL.PENDING}?socode=${encodeURIComponent(socode)}`, { ignoreLoading: true });
  const resolvePending = (pending_id, stcode) => api.post(API_URL.PENDING, { pending_id, stcode }, { ignoreLoading: true });
  const dropPending = (pending_id) => api.delete(`${API_URL.PENDING}?pending_id=${pending_id}`, { ignoreLoading: true });

  const confirm = (socode) => api.post(API_URL.CONFIRM, { socode });

  return { importFile, importWithCustomer, pending, resolvePending, dropPending, confirm };
};

export default AiSoImportService;
