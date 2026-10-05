import { column as deliveryColumn } from "../delivery/delivery.model";
import { comma } from "../../../utils/util";

/* คอลัมน์ของ "ใบขายสินค้า" โดยเฉพาะ

   แยกไฟล์ออกมาจาก delivery.model.js เพราะไฟล์นั้นใช้ร่วมกับใบส่งของ
   ถ้าไปแก้ตรงนั้น ใบส่งของจะเปลี่ยนตามไปด้วย

   ต่างจากของเดิมตรงคอลัมน์ "หน่วยละ": เดิมแสดง unit (KG / ลูก)
   ซึ่งไม่ตรงกับชื่อคอลัมน์ ที่ถูกคือราคาต่อหน่วย ส่วนชื่อคอลัมน์คงเดิม */
export const column = deliveryColumn
  /* ตัดคอลัมน์ "ใบขายสินค้า" (socode) ออก: มันซ้ำเลขที่เอกสารทุกแถว
     ทั้งที่มีอยู่บนหัวใบแล้ว เอาที่ว่างไปให้คอลัมน์รายละเอียดแทน
     ตัดเฉพาะใบขายสินค้า ใบส่งของยังมีคอลัมน์นี้เหมือนเดิม */
  .filter((col) => col.key !== "socode")
  .map((col) => {
    /* "หน่วยละ" = ราคาต่อหน่วย (เดิมแสดง unit ซึ่งไม่ตรงกับชื่อคอลัมน์) */
    if (col.key === "unit") {
    return {
      ...col,
      /* หัวคอลัมน์ของเดิมเป็น <div> จัดกลาง ต้องทับด้วย ไม่งั้นหัวกับตัวเลข
         คนละแนวกัน (ตัวเลขชิดขวา หัวอยู่กลาง) */
      title: <div style={{ textAlign: "right" }}>หน่วยละ</div>,
      dataIndex: "price",
      align: "right",
      className: "!pe-3",
      render: (_, rec) => comma(Number(rec?.price || 0), 2, 2),
    };
    }

    /* "จำนวนเงิน" = จำนวน x ราคา (เดิมแสดง price เฉยๆ ซ้ำกับคอลัมน์ก่อนหน้า) */
    if (col.key === "price") {
    return {
      ...col,
      title: <div style={{ textAlign: "right" }}>จำนวนเงิน</div>,
      align: "right",
      className: "!pe-3",
      render: (_, rec) =>
        comma(Number(rec?.qty || 0) * Number(rec?.price || 0), 2, 2),
    };
    }

    return col;
  });

export default column;
