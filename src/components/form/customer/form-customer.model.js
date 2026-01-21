
import { Typography } from "antd";
const Link = Typography.Link;

export const itemtypesColumn = [
  {
    title: "ตัวอย่างรหัสสินค้า",
    dataIndex: "stcode",
    // width: "20%",
    key: "stcode",
    render: (v) => <Link className="text-select" >{v}</Link>
  },
  {
    title: "ชื่อประเภทสินค้า",
    dataIndex: "typename",
    width: "55%",
    key: "typename",
    render: (v) => <Link className="text-select"> {v}</Link>,
  },
  {
    title: "หมวดหมู่สินค้า",
    dataIndex: "categoryname",
    width: "25%",
    key: "categoryname",
    render: (v) => <Link className="text-select"> {v}</Link>,
  },
];
