/* ============================================================================
   ผู้สร้าง / ผู้แก้ไขล่าสุด — แสดงขวาบนของหน้าเอกสาร/ข้อมูล (หน้าตาเดียวกันทุกระบบ)
   ใช้: <AuditInfo data={header} />
     data.created_name | data.created_by  (ชื่อผู้สร้าง — API ส่วนใหญ่ส่งชื่อมาในช่อง created_by)
     data.created_date
     data.updated_name | data.updated_by
     data.updated_date
   ไม่มีข้อมูลเลย (เช่น หน้าสร้างใหม่) = ไม่แสดง
   ============================================================================ */
import React from "react";
import dayjs from "dayjs";

const when = (d) => (d && !String(d).startsWith("0000") && dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY HH:mm") : "");
/* created_by บางหน้าเป็นรหัสผู้ใช้ (ตัวเลข) ไม่ใช่ชื่อ -> ไม่แสดงตัวเลข */
const nameOf = (n) => {
  const s = String(n ?? "").trim();
  return !s || /^\d+$/.test(s) ? "" : s;
};

export default function AuditInfo({ data, style }) {
  const cName = nameOf(data?.created_name ?? data?.created_by);
  const uName = nameOf(data?.updated_name ?? data?.updated_by);
  const cDate = when(data?.created_date);
  const uDate = when(data?.updated_date);
  if (!cName && !cDate && !uName && !uDate) return null;
  return (
    <div style={{ textAlign: "right", fontSize: 12, color: "#666", fontWeight: 400, lineHeight: 1.6, ...style }}>
      สร้างโดย {cName || "-"}{cDate ? " " + cDate : ""}
      {" · "}แก้ไขล่าสุดโดย {uName || "-"}{uDate ? " " + uDate : ""}
    </div>
  );
}
