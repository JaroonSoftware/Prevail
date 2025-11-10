/** get items column */
import { TagItemTypes } from "../../badge-and-tag";
export const columns = ()=>{
  return [
    {
      title: "รหัสสินค้า",
      key: "stcode",
      dataIndex: "stcode", 
      width: 100,
    },
    {
      title: "ชื่อสินค้า",
      dataIndex: "stname",
      key: "stname",
    },
    {
      title: "ประเภทสินค้า",
      dataIndex: "typename",
      key: "typename",
      width: 130,
    },
    {
      title: "ราคาขาย",
      dataIndex: "price",
      key: "price",
      width: 100,
    },
    {
      title: "หน่วย",
      dataIndex: "unit",
      key: "unit",
      width: 100,
      render: (h)=><TagItemTypes data={h} />,
    },
  ]
};