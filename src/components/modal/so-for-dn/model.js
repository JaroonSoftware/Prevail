/** get items column */
import dayjs from 'dayjs';
import { TagSalesOrderStatus } from "../../../components/badge-and-tag";


export const columns = ()=>{
  return [
    {
      key: "code",
      dataIndex: "code",
      align: "left",
      hidden: true,
    },
    {
      title: "รหัสใบส่งสินค้า",
      key: "socode",
      dataIndex: "socode", 
    },
    {
      title: "วันที่ใบส่งสินค้า",
      key: "sodate",
      dataIndex: "sodate",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: 120,
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "cusname",
    key: "cusname", 
  },
  {
    title: "สถานะ",
    dataIndex: "doc_status",
    key: "doc_status", 
    width: '13%',
    sorter: (a, b) => a.doc_status.localeCompare(b.doc_status),
    sortDirections: ["descend", "ascend"],
    render: (data) => <TagSalesOrderStatus result={data} />,
  },
  ]
};