import { Typography } from "antd";
import { comma } from "../../../utils/util";

const calTotalDiscount = (rec) => {
  const total = Number(rec?.qty || 0) * Number(rec?.price || 0);
  const discount = 1 - Number(rec?.discount || 0) / 100;

  return total * discount;
};

export const column = [
  {
    title: (
      <>
        ลำดับ
        <br />
        Item
      </>
    ),
    key: "index",
    align: "center",
    width: "8%",
    // onCell: () => ({
    //   style: {
    //     borderLeft: "1px solid var(---color--1)",
    //   },
    // }),
    // render: (_, record, idx) => <span key={record?.stcode}>{idx + 1}</span>,
    render: (_, record, idx) => (
      <Typography.Text className="tx-info">{idx + 1}</Typography.Text>
    ),
  },
  {
    title: (
      <>
        รหัสสินค้า
        <br />
        Product Code
      </>
    ),
    align: "center",
    key: "stcode",
    dataIndex: "stcode",
    width: 100,
  },
  {
    title: (
      <>
        รายการสินค้า
        <br />
        Description
      </>
    ),
    align: "center",
    key: "stname",
    dataIndex: "stname",
  },
  {
    title: (
      <>
        จำนวน
        <br />
        Quantity
      </>
    ),
    align: "center",
    key: "qty",
    dataIndex: "qty",
    width: 100,
    render: (v) => (
      <Typography.Text className="tx-info">{comma(Number(v))}</Typography.Text>
    ),
  },
  {
    title: (
      <>
        ราคา/หน่วย
        <br />
        Unit Price
      </>
    ),
    align: "center",
    width: 100,
    key: "price",
    dataIndex: "price",
    render: (v) => (
      <Typography.Text className="tx-info">{comma(Number(v))}</Typography.Text>
    ),
  },
  {
    title: (
      <>
        จำนวนเงิน
        <br />
        Amount
      </>
    ),
    align: "right",
    width: 100,
    key: "amount",
    dataIndex: "amount",
    onCell: () => ({
      style: {
        borderRight: "1px solid var(---color--1)",
      },
    }),
    render: (_, rec) => <>{comma(calTotalDiscount(rec), 2, 2)}</>,
  },
];
