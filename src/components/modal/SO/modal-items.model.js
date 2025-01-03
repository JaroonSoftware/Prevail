/** get items column */
import { TagItemTypes } from "../../badge-and-tag";
import { Image } from "antd";
import { BACKEND_URL_MAIN } from '../../../utils/util';
export const columns = ()=>{
  return [
    {
      key: "code",
      dataIndex: "code",
      align: "left",
      hidden: true,
    },
    {
      title: "รหัสสินค้า",
      key: "stcode",
      dataIndex: "stcode", 
    },
    {
      title: "รหัสใบขายสินค้า",
      key: "socode",
      dataIndex: "socode", 
    },
    {
      title: "รูปประกอบ",
      dataIndex: "file",
      key: "file",
      width: 120,
      align: "center",
      render: (im, rec) => 
        {
          const img = (!!rec.file_name ? `/uploads/` + rec.file_name : `/logo.png`
          );
          return <>
          <Image
        style={{ borderRadius: 10 }}
        preview={false}
        height={75}
        alt={`Image ${rec.file_name}`}
        src={`${BACKEND_URL_MAIN}` + img}
      />
      </>
      },
    },
    {
      title: "ชื่อสินค้า",
      dataIndex: "stname",
      key: "stname",
    },
    {
      title: "จำนวนที่ขาย",
      dataIndex: "qty",
      key: "qty",
    },
      {
        title: "จำนวนที่ส่งแล้ว",
        dataIndex: "delamount",
        key: "delamount",
      },
    {      
      title: "หน่วย",
      dataIndex: "unit",
      key: "unit",
      render: (h)=><TagItemTypes data={h} />,
    },
  ]
};