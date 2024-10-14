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
      title: "รหัสใบส่งของ",
      key: "dncode",
      dataIndex: "dncode", 
    },
    {
      title: "รหัสใบส่งซื้อ",
      key: "socode",
      dataIndex: "socode", 
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
      title: "จำนวนที่ส่งแล้ว",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "ราคา",
      dataIndex: "price",
      key: "price",
    },     
    {
      title: "หน่วย",
      dataIndex: "unit",
      key: "unit",
      render: (h)=><TagItemTypes data={h} />,
    },
  ]
};