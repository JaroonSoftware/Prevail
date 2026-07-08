
import { TagInvoiceStatus } from "../../badge-and-tag";
import { formatMoney } from "../../../utils/util";

/** get items column */
export const customersColumn = ()=>{
    return [
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        hidden: "true",
      },
      {
        title: "เลขที่ใบวางบิล",
        key: "blcode",
        width: "14%",
        dataIndex: "blcode",
      },
      {
        title: "วันที่ใบวางบิล",
        key: "bldate",
        width: "13%",
        dataIndex: "bldate",
      },
      {
        title: "รหัสลูกค้า",
        key: "cuscode",
        width: "12%",
        dataIndex: "cuscode",
      },
      {
        title: "ชื่อลูกค้า",
        dataIndex: "cusname",
        width: "28%",
        key: "cusname",
      },
      {
        title: "ยอดรวมเงิน",
        key: "total_amount",
        width: "15%",
        align: "right",
        className: "!pe-3",
        render: (_, rec) =>
          formatMoney(
            Number(rec?.total_price || 0) - Number(rec?.discount || 0),
            2
          ),
      },
      {
        title: "สถานะ",
        dataIndex: "doc_status",
        key: "doc_status",
        width: '18%',
        align: "center",
        render: (data) => <TagInvoiceStatus result={data} />,
      },
    ]
  };
