// import { Typography } from "antd";
import { comma } from "../../../utils/util";

export const pickuplistColumn = () => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    width: 80,
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "ประเภทสินค้า",
    key: "typename",
    dataIndex: "typename",
    align: "left",
    render: (_, rec) => rec.typename,
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: 120,
    align: "left",
  },
  {
    title: "ชื่อสินค้า",
    key: "stname",
    dataIndex: "stname",
    align: "left",
    render: (_, rec) => rec.stname,
  },
  {
    title: "จำนวน",
    key: "qty",
    dataIndex: "qty",
    align: "right",
    className: "!pe-3",
    editable: true,
    required: true,
    type: 'number',
    render: (_, rec) => <>{comma(Number(rec?.qty || 0), 2, 2)}</>,
    // width:'12%',
  },
  {
    title: "หน่วยสินค้า",
    dataIndex: "unit",
    key: "unit", 
      align: "right", 
      width: "8%",
  },
];