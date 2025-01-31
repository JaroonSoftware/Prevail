/** get items column */
import { TagSalesOrderStatus } from "../../badge-and-tag";
export const columns = ()=>{
  return [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      hidden: "true",
    },
    {
      title: "เลขที่ใบขายสินค้า",
      key: "socode",
      width: "15%",
      dataIndex: "socode",         
    },
    {
      title: "วันที่ใบขายสินค้า",
      key: "sodate",
      width: "15%",
      dataIndex: "sodate", 
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
      render: (data) => <TagSalesOrderStatus result={data} />,
    },
  ]
};