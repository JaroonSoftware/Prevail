import { Typography } from "antd";


export const column = [
  {
    title: <>ลำดับ</>,
    key: "index",
    align: "center",
    width: "10%",
    render: (_, record, idx) => (
      <Typography.Text className="tx-info">{idx + 1}</Typography.Text>
    ),
  },
  {
    title: <>รายการสินค้า</>,
    align: "center",
    key: "stname",
    width: "50%",
    dataIndex: "stname",
  }, {
    title: <>รายการสินค้า</>,
    align: "center",
    key: "stnameEN",
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
    // onCell: () => ({
    //   style: {
    //     borderRight: "1px solid var(---color--1)",
    //   },
    // }),
    // render: (_, record) => (
    //   <Typography.Text className="tx-info">
    //     {comma(Number(record.price), 2, 2)}
    //   </Typography.Text>
    // ),
  },
  
];
export const column2 = [
  {
    title: <>ลำดับ</>,
    key: "index",
    align: "center",
    width: "10%",
    render: (_, record, idx) => (
      <Typography.Text className="tx-info">{idx + 1}</Typography.Text>
    ),
  },
  {
    title: <>รายการสินค้า</>,
    align: "center",
    key: "stname",
    width: "50%",
    dataIndex: "stname",
  }, {
    title: <>รายการสินค้า</>,
    align: "center",
    key: "stnameEN",
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
