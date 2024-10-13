/** get items column */
import { TagItemTypes } from "../../badge-and-tag";
export const columns = ()=>{
  return [
    {
      title: "code",
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
      title: "ราคาต่อหน่วย",
      dataIndex: "price",
      key: "price",
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