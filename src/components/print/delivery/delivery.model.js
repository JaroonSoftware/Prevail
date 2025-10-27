import { Typography } from "antd";

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
    title: (
      <div style={{ textAlign: "center" }}>
        รายละเอียด
      </div>
    ),
    align: "center",
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
    title: (
      <div style={{ textAlign: "center" }}>
     หน่วยละ
      </div>
    ),
    align: "center",
    key: "unit",
    dataIndex: "unit",
    width: "10%",
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
       จำนวนเงิน
      </div>
    ),
    align: "center",
    width: "10%",
    key: "price",
    dataIndex: "price",
    onCell: () => ({
      style: {
        borderRight: "1px solid ",
      },
    }),
  },
];
