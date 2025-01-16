import { Typography } from "antd";
import { comma } from "../../../utils/util";

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
    dataIndex: "stname",
  },
  {
    title: <>หน่วย</>,
    align: "right",
    width: 100,
    key: "unit",
    dataIndex: "unit",
  },
  {
    title: <>ราคา</>,
    align: "right",
    width: 100,
    key: "price",
    dataIndex: "price",
    onCell: () => ({
      style: {
        borderRight: "1px solid var(---color--1)",
      },
    }),
    // render: (_, record) => (
    //   <Typography.Text className="tx-info">
    //     {comma(Number(record.price), 2, 2)}
    //   </Typography.Text>
    // ),
  },
];
