import { Typography } from "antd";


/** get items column */
export const deliverynoteColumn = ({handleChoose})=>{
    const Link = Typography.Link;
    return [
      {
        title: "รหัสใบส่งสินค้า",
        key: "dncode",
        width: "30%",
        dataIndex: "dncode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "ชื่อผู้รับ",
        dataIndex: "cusname",
        width: "70%",
        key: "cusname",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {v}</Link>
      } 
    ]
  };