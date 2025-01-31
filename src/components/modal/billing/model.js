
import { TagInvoiceStatus } from "../../badge-and-tag";

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
        width: "15%",
        dataIndex: "blcode",         
      },
      {
        title: "วันที่ใบวางบิล",
        key: "bldate",
        width: "15%",
        dataIndex: "bldate", 
      },
      {
        title: "รหัสลูกค้า",
        key: "cuscode",
        width: "15%",
        dataIndex: "cuscode", 
      },
      {
        title: "ชื่อลูกค้า",
        dataIndex: "cusname",
        width: "35%",
        key: "cusname",
      },
      {
        title: "สถานะ",
        dataIndex: "doc_status",
        key: "doc_status", 
        width: '20%',
        align: "center",
        render: (data) => <TagInvoiceStatus result={data} />,
      },
    ]
  };