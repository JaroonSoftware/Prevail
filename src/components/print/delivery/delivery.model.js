import { Typography } from "antd";
import { comma } from "../../../utils/util";

/* คอลัมน์ตารางของ "ใบส่งสินค้า/ใบแจ้งหนี้"
   จัดตามฟอร์มตัวอย่างที่ลูกค้าส่งมา: No. / รายละเอียด / จำนวน / หน่วยละ / จำนวนเงิน
   (ไม่มีคอลัมน์เลขที่ใบขายสินค้าแล้ว เพราะเลขที่เอกสารอยู่บนหัวใบ)

   ไฟล์นี้ถูก so.model.js ยืมไปใช้ด้วย ถ้าแก้ตรงนี้ให้เช็คใบขายสินค้าด้วยเสมอ */
export const column = [
  {
    title: <>No.</>,
    key: "index",
    align: "center",
    width: "8%",
    render: (_, record, idx) => (
      <Typography.Text className="tx-info">{idx + 1}</Typography.Text>
    ),
  },
  {
    title: <div style={{ textAlign: "center" }}>รายละเอียด</div>,
    align: "left",
    width: "42%",
    key: "stname",
    dataIndex: "stname",
  },
  {
    /* ตามฟอร์มตัวอย่าง: จำนวนทศนิยม 3 ตำแหน่ง ตามด้วยหน่วย เช่น "1.000 Kg."
       ใบขายสินค้าไม่เอารูปแบบนี้ จึงทับกลับใน so.model.js */
    title: <div style={{ textAlign: "right" }}>จำนวน</div>,
    align: "right",
    className: "!pe-3",
    key: "qty",
    width: "16%",
    dataIndex: "qty",
    render: (_, rec) =>
      `${comma(Number(rec?.qty || 0), 3, 3)} ${rec?.unit || ""}`.trim(),
  },
  {
    /* "หน่วยละ" = ราคาต่อหน่วย เดิมผูกกับ dataIndex "unit" ซึ่งแสดง KG / ลูก
       ไม่ตรงกับชื่อคอลัมน์ หัวคอลัมน์จัดชิดขวาให้ตรงแนวกับตัวเลข */
    title: <div style={{ textAlign: "right" }}>หน่วยละ</div>,
    align: "right",
    className: "!pe-3",
    key: "unit",
    dataIndex: "price",
    width: "16%",
    render: (_, rec) => comma(Number(rec?.price || 0), 2, 2),
  },
  {
    /* "จำนวนเงิน" = จำนวน x ราคา เดิมแสดง price เฉยๆ ซึ่งซ้ำกับคอลัมน์ก่อนหน้า */
    title: <div style={{ textAlign: "right" }}>จำนวนเงิน</div>,
    align: "right",
    className: "!pe-3",
    width: "18%",
    key: "price",
    dataIndex: "price",
    render: (_, rec) =>
      comma(Number(rec?.qty || 0) * Number(rec?.price || 0), 2, 2),
  },
];
