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
    key: "blcode",
    dataIndex: "blcode",
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
      <Typography.Text className="tx-info" style={{paddingRight: "20px"}}>{comma(Number(v))}</Typography.Text>
    ),
    onCell: () => ({
      style: {
        borderRight: "1px solid ",
      },
    }),
  },

];
