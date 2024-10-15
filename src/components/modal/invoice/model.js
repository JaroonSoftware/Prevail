
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
        title: "เลขที่ใบแจ้งหนี้",
        key: "ivcode",
        width: "15%",
        dataIndex: "ivcode",         
      },
      {
        title: "วันที่ใบแจ้งหนี้",
        key: "ivdate",
        width: "15%",
        dataIndex: "ivdate", 
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