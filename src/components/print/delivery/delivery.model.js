import { Typography } from "antd";
import { comma } from "../../../utils/util";

export const column = [
  {
    title: (
      <>
        No.
      </>
    ),
    key: "index",
    align: "center",
    width: "5%",
    render: (_, record, idx) => (
      <Typography.Text className="tx-info">{idx + 1}</Typography.Text>
    ),
  },
  {
    title: "ใบขายสินค้า",
    dataIndex: "socode",
    key: "socode",
    width: "15%",
    align: "center",
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        รายละเอียด
      </div>
    ),
    align: "left",
    width: "15%",
    key: "stname",
    dataIndex: "stname",
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
     จำนวน
      </div>
    ),
    align: "center",
    key: "qty",
    width: "10%",
    dataIndex: "qty",
   
  },
  {
    /* "หน่วยละ" = ราคาต่อหน่วย เดิมผูกกับ dataIndex "unit" ซึ่งแสดง KG / ลูก
       ไม่ตรงกับชื่อคอลัมน์ หัวคอลัมน์จัดชิดขวาให้ตรงแนวกับตัวเลข */
    title: <div style={{ textAlign: "right" }}>หน่วยละ</div>,
    align: "right",
    className: "!pe-3",
    key: "unit",
    dataIndex: "price",
    width: "10%",
    render: (_, rec) => comma(Number(rec?.price || 0), 2, 2),
  },
  {
    /* "จำนวนเงิน" = จำนวน x ราคา เดิมแสดง price เฉยๆ ซึ่งซ้ำกับคอลัมน์ก่อนหน้า */
    title: <div style={{ textAlign: "right" }}>จำนวนเงิน</div>,
    align: "right",
    className: "!pe-3",
    width: "10%",
    key: "price",
    dataIndex: "price",
    render: (_, rec) =>
      comma(Number(rec?.qty || 0) * Number(rec?.price || 0), 2, 2),
    onCell: () => ({
      style: {
        borderRight: "1px solid ",
      },
    }),
  },
];
