import { Typography } from "antd";


/** get items column */
export const supplierColumn = ({handleChoose})=>{
    const Link = Typography.Link;
    return [
      {
        title: "รหัสผู้ขาย",
        key: "supcode",
        width: "30%",
        dataIndex: "supcode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "ชื่อผู้ขาย",
        dataIndex: "supname",
        width: "70%",
        key: "supname",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {v}</Link>
      } 
    ]
  };