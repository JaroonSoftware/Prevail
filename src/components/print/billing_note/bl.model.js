import { Typography } from "antd";
import { comma } from "../../../utils/util";
import dayjs from 'dayjs';
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
        เลขที่ใบกำกับ

      </div>
    ),
    align: "center",
    width: "15%",
    key: "ivcode",
    dataIndex: "ivcode",
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        วันที่
      </div>
    ),
    align: "center",
    key: "redate",
    width: "10%",
    dataIndex: "redate",
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        ครบกำหนด
      </div>
    ),
    align: "center",
    key: "duedate",
    width: "10%",
    dataIndex: "duedate",
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        จำนวนเงิน
      </div>
    ),
    align: "right",
    key: "price",
    dataIndex: "price",
    width: "10%",
    render: (v) => (
      <Typography.Text className="tx-info">{comma(Number(v))}</Typography.Text>
    ),
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        ชำระแล้ว
      </div>
    ),
    align: "right",
    key: "",
    dataIndex: "",
    width: "10%",
    render: (v) => (
      <Typography.Text className="tx-info">{comma(Number(v))}</Typography.Text>
    ),
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        เงินคงค้าง
      </div>
    ),
    align: "left",
    width: "10%",
    key: "",
    dataIndex: "",
    onCell: () => ({
      style: {
        borderRight: "1px solid ",
      },
    }),
  },
];
