/** get items column */
import { TagDeliveryNoteStatus } from "../../badge-and-tag";
export const columns = ()=>{
  return [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      hidden: "true",
    },
    {
      title: "เลขที่ใบส่งของ",
      key: "dncode",
      width: "15%",
      dataIndex: "dncode",         
    },
    {
      title: "วันที่ใบส่งของ",
      key: "dndate",
      width: "15%",
      dataIndex: "dndate", 
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
      render: (data) => <TagDeliveryNoteStatus result={data} />,
    },
  ]
};