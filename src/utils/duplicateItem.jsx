import { Modal } from "antd";

/* เตือนก่อนเพิ่มสินค้าซ้ำในเอกสาร (รหัสเดียวกัน หรือชื่อเดียวกันหลังตัดช่องว่าง)
   คืน Promise<boolean>: true = เพิ่มได้ (ไม่ซ้ำ หรือผู้ใช้กดยืนยันเพิ่มซ้ำ), false = ยกเลิก
   list   : รายการสินค้าในเอกสารตอนนี้
   item   : สินค้าที่กำลังจะเพิ่ม { stcode, stname }
   isSelf : (row) => true ถ้าเป็นแถวเดียวกับที่กำลังแก้ (ไม่นับว่าซ้ำกับตัวเอง) */
const norm = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();

export const findDuplicateItems = (list = [], item = {}, isSelf = () => false) => {
  const code = String(item?.stcode || "").trim();
  const name = norm(item?.stname);
  if (!code && !name) return [];
  return list
    .map((r, i) => ({ r, line: i + 1 }))
    .filter(({ r }) => !isSelf(r) && ((code && String(r?.stcode || "").trim() === code) || (name && norm(r?.stname) === name)));
};

export const confirmDuplicateItem = (list, item, isSelf) =>
  new Promise((resolve) => {
    const dups = findDuplicateItems(list, item, isSelf);
    if (!dups.length) return resolve(true);
    Modal.confirm({
      title: "สินค้าซ้ำในเอกสาร",
      content: (
        <>
          <div><b>{item?.stname || item?.stcode}</b> มีอยู่แล้วในบรรทัด:</div>
          {dups.map(({ r, line }) => (
            <div key={line}>• บรรทัดที่ {line}: {r?.stcode} {r?.stname}{r?.qty != null ? ` (จำนวน ${r.qty})` : ""}</div>
          ))}
          <div style={{ marginTop: 8 }}>ต้องการเพิ่มซ้ำอีกบรรทัดหรือไม่?</div>
        </>
      ),
      okText: "เพิ่มซ้ำ",
      cancelText: "ไม่เพิ่ม",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
