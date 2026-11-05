import React from "react";
export default function DocumentNumberPreview({ visible, linked = false }) {
  if (!visible) return null;
  return <div style={{ fontSize: 13, fontWeight: 400, whiteSpace: "normal", color: "#667085", marginTop: 4 }}>
    {linked ? "เลขที่อ้างอิงจากใบขายสินค้า ระบบตรวจสอบอีกครั้งเมื่อบันทึก" : "เลขที่คาดการณ์ — ระบบจะคำนวณเลขที่จริงอีกครั้งเมื่อบันทึก"}
  </div>;
}
