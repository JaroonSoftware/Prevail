
import { Typography } from "antd";
const Link = Typography.Link;

export const CustomerColumn = [
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    // width: "20%",
    key: "cuscode",
    render: (v) => <Link className="text-select" >{v}</Link>
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "cusname",
    width: "55%",
    key: "cusname",
    render: (v) => <Link className="text-select"> {v}</Link>,
  },
  {
    title: "เขตขนส่ง",
    dataIndex: "county_name",
    width: "25%",
    key: "county_name",
    render: (v) => <Link className="text-select"> {v}</Link>,
  },
];
