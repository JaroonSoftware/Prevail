import { Badge, Space } from "antd";
import { Button } from "antd";
// import { PrinterOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { EditOutlined } from "@ant-design/icons";
// import dayjs from 'dayjs';

export const accessColumn = ({ handleEdit, handleDelete, handleView }) => [
  {
    title: "รหัสสินค้า",
    key: "stcode",
    dataIndex: "stcode",
    align: "left",
    width: 90,
    sorter: (a, b) => (a?.stcode || "").localeCompare(b?.stcode || ""),
  },
  {
    title: "ชื่อสินค้า",
    dataIndex: "stname",
    key: "stname",
    sorter: (a, b) => (a?.stname || "").localeCompare(b?.stname || ""),
  },
  {
    title: "ชื่อสินค้า(Eng)",
    dataIndex: "stnameEN",
    key: "stnameEN",
    width: "25%",
    sorter: (a, b) => (a?.stnameEN || "").localeCompare(b?.stnameEN || ""),
  },
  {
    title: "ราคาขาย",
    dataIndex: "price",
    key: "price",
    width: 100,
    sorter: (a, b) => (a?.price || 0) - (b?.price || 0),    
  },
  {
    title: "ประเภท",
    dataIndex: "typename",
    key: "typename",
    sorter: (a, b) => (a?.typename || "").localeCompare(b?.typename || ""),
    width: 90,
  },
  {
    title: "Stock",
    dataIndex: "stock",
    key: "stock",
    sorter: (a, b) => (a?.stock || "").localeCompare(b?.stock || ""),
    width: 70,
  },
  {
    title: "หน่วย",
    dataIndex: "unit",
    key: "unit",
    sorter: (a, b) => (a?.unit || "").localeCompare(b?.unit || ""),
    width: 60,
  },
  {
    title: "สถานะ",
    dataIndex: "active_status",
    key: "status",
    width: 120,
    sorter: (a, b) => (a?.status || "").localeCompare(b?.status || ""),
    render: (data) => (
      <div>
        {data === "Y" ? (
          <Badge status="success" text="เปิดการใช้งาน" />
        ) : (
          <Badge status="error" text="ปิดการใช้การ" />
        )}
      </div>
    ),
  },
  {
    title: "Action",
    key: "operation",
    width: "60px",
    fixed: "right",
    render: (text, record) => (
      <Space>
        <Button
          icon={<EditOutlined />}
          className="bn-primary-outline"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => handleEdit(record)}
          size="small"
        />
      </Space>
    ),
  },
];

export const columnsOrder = ({ DragHandle }) => [ 
  { key: "sort", align: "center", width: 100, render: () => <DragHandle /> },
   {
    title: "No.",
    key: "seq",
    align: "left",
    width: 80,
    // ใช้ index ของแถวใน table โดยตรง
    render: (text, record, index) => <span>{index + 1}</span>,
  },
  // { title: "key", dataIndex: "key" },
  {
    title: "รหัสสินค้า",
    key: "stcode",
    dataIndex: "stcode",
    align: "left",
    width: 200,
    sorter: (a, b) => (a?.stcode || "").localeCompare(b?.stcode || ""),
  },
  {
    title: "ชื่อสินค้า",
    dataIndex: "stname",
    key: "stname",
    // width: "30%",
    sorter: (a, b) => (a?.stname || "").localeCompare(b?.stname || ""),
  },
];

export const Items = {
  id: null,
  stcode: null,
  stname: null,
  prename: null,
  idno: null,
  road: null,
  subdistrict: null,
  district: null,
  province: null,
  zipcode: null,
  country: null,
  delidno: null,
  delroad: null,
  delsubdistrict: null,
  deldistrict: null,
  delprovince: null,
  delzipcode: null,
  delcountry: null,
  tel: null,
  fax: null,
  taxnumber: null,
  email: null,
  active_status: "Y",
};
