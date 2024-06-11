import { Typography } from "antd";


/** get items column */
export const columns = ({handleChoose})=>{
    const Link = Typography.Link;
    return [
      {
        title: "รหัสสินค้า",
        key: "stcode",
        dataIndex: "stcode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "ชื่อสินค้า",
        dataIndex: "stname",
        key: "stname",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {v}</Link>
      },
      {
        title: "ชื่อสินค้า(EN)",
        dataIndex: "stnameEN",
        key: "stnameEN",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {v}</Link>
      },
    ]
  };