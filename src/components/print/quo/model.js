import { Typography } from "antd";

export const column = [
  {
    title: <>ลำดับ</>,
    key: "index",
    align: "center",
    width: "10%",
    render: (_, record, idx) => (
      <Typography.Text style={{fontSize: "12px"}}>{idx + 1}</Typography.Text>
    ),
  },
  {
    title: <>รายการสินค้า</>,
    align: "center",
    colSpan: 2,
    key: "stname",
    width: "40%",
    dataIndex: "stname",
   
  },
  {
    align: "center",
    key: "stnameEN",
    colSpan: 0,
    width: "50%",
    dataIndex: "stnameEN",
  },
  {
    title: <>หน่วย</>,
    align: "center",
    width: "15%",
    key: "unit",
    dataIndex: "unit",
  },
  {
    title: <>ราคา</>,
    align: "center",
    width: "15%",
    key: "price",
    dataIndex: "price",
   
  },
];
export const column2 = [
  {
    title: <>ลำดับ</>,
    key: "index",
    align: "center",
    width: "10%",
    render: (_, record, idx) => (
      <Typography.Text style={{fontSize: "12px"}} >{idx + 1+ Math.floor(record.total) }</Typography.Text>
    ),
  },
  {
    title: <>รายการสินค้า</>,
    align: "center",
    colSpan: 2,
    key: "stname",
    width: "40%",
    dataIndex: "stname",
   
  },
  {
    align: "center",
    key: "stnameEN",
    colSpan: 0,
    width: "50%",
    dataIndex: "stnameEN",
  },
  {
    title: <>หน่วย</>,
    align: "center",
    width: "15%",
    key: "unit",
    dataIndex: "unit",
  },
  {
    title: <>ราคา</>,
    align: "center",
    width: "15%",
    key: "price",
    dataIndex: "price",
  },
];
