import { Badge, Space } from "antd";
import { Button } from "antd";
// import { PrinterOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { EditOutlined } from "@ant-design/icons";
// import dayjs from 'dayjs';

export const accessColumn = ({ handleEdit, handleDelete, handleView }) => [
  {
    title: "รหัสผู้ขาย",
    key: "supcode",
    dataIndex: "supcode",
    width: "10%",
    align: "left",
    sorter: (a, b) => (a?.supcode || "").localeCompare(b?.supcode || ""),
  },
  {
    title: "ชื่อผู้ขาย",
    dataIndex: "supname",
    key: "supname",
    width: "30%",
    sorter: (a, b) => (a?.supname || "").localeCompare(b?.supname || ""),
  },
  {
    title: "จังหวัด",
    dataIndex: "province",
    key: "province",
    width: "20%",
    sorter: (a, b) => (a?.province || "").localeCompare(b?.province || ""),
  },
  {
    title: "เบอร์โทร",
    dataIndex: "tel",
    key: "tel",
    width: "20%",
    sorter: (a, b) => (a?.tel || "").localeCompare(b?.tel || ""),
  },
  {
    title: "สถานะ",
    dataIndex: "active_status",
    key: "active_status",
    width: "20%",
    sorter: (a, b) => (a?.active_status || "").localeCompare(b?.active_status || ""),
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
    width: "10%",
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
export const columnsParametersEditable = (
  { handleRemove }
) => {
  const col = ProductColumn({ handleRemove });
  return col.map((col, ind) => {
    if (!col.editable) return col;

    return {
      ...col,
      onCell: (record) => {
        // console.log(record);
        return {
          record,
          editable: col.editable,
          title: col.title,
          // required: !!col?.required,
          type: col?.type || "input",
        };
      },
    };
  });
};

export const ProductColumn = ({ handleRemove }) => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    align: "center",
    width: "5%",
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: "10%",
    align: "center",
  },
  {
    title: "ชื่อสินค้า",
    dataIndex: "stname",
    key: "stname",
    align: "left",
    width: "50%",
    render: (_, rec) => rec.stname,
  },
  {
    title: "ตัวเลือก",
    align: "center",
    key: "operation",
    dataIndex: "operation",
    render: (_, record, idx) => handleRemove(record),
    width: "4%",
    fixed: "right",
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
