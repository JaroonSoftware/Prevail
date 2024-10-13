/** get items column */
import { TagItemTypes } from "../../badge-and-tag";
export const columns = ()=>{
  return [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      hidden: "true",
    },
    {
      title: "รหัสใบสั่งซื้อ",
      key: "pocode",
      dataIndex: "pocode", 
    },
    {
      title: "รหัสสินค้า",
      key: "stcode",
      dataIndex: "stcode", 
    },
    {
      title: "ชื่อสินค้า",
      dataIndex: "stname",
      key: "stname",
    },
    {
      title: "ราคาซื้อ",
      dataIndex: "buyprice",
      key: "buyprice",
    },    
    {
      title: "หน่วย",
      dataIndex: "unit",
      key: "unit",
      render: (h)=><TagItemTypes data={h} />,
    },
    {
      title: "จำนวนสั่งซื้อ",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "จำนวนที่รับแล้ว",
      dataIndex: "recamount",
      key: "recamount",
    },
  ]
};