import { Typography } from "antd";
import { TagInvoiceStatus } from "../../../components/badge-and-tag/";

/** get items column */
export const customersColumn = ({handleChoose})=>{
    const Link = Typography.Link;
    return [
      {
        title: "เลขที่ใบแจ้งหนี้",
        key: "ivcode",
        width: "15%",
        dataIndex: "ivcode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "วันที่ใบแจ้งหนี้",
        key: "ivdate",
        width: "15%",
        dataIndex: "ivdate", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "รหัสลูกค้า",
        key: "cuscode",
        width: "15%",
        dataIndex: "cuscode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "ชื่อลูกค้า",
        dataIndex: "cusname",
        width: "35%",
        key: "cusname",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {v}</Link>
      },
      {
        title: "สถานะ",
        dataIndex: "doc_status",
        key: "doc_status", 
        width: '20%',
        align: "center",
        sorter: (a, b) => a.doc_status.localeCompare(b.doc_status),
        sortDirections: ["descend", "ascend"],
        render: (data) => <TagInvoiceStatus result={data} />,
      },
    ]
  };