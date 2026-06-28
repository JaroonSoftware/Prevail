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
      <Typography.Text className="tx-info">{record._no ?? idx + 1}</Typography.Text>
    ),
  },
  {
    title: (
      <div style={{ textAlign: "center" }}>
        เลขที่ใบขายสินค้า
      </div>
    ),
    align: "center",
    width: "15%",
    key: "socode",
    dataIndex: "socode",
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
    key: "total_price",
    dataIndex: "total_price",
    width: "10%",
    render: (v,t) => (
      <Typography.Text className="tx-info" style={{paddingRight: "20px"}}>{comma(Number(t.total_price || 0), 2)}</Typography.Text>
    ),
    onCell: () => ({
      style: {
        borderRight: "1px solid ",
      },
    }),
  },

];
