import { Badge, Space } from "antd";
import { Button } from "antd";
// import { PrinterOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { EditOutlined } from "@ant-design/icons";
// import dayjs from 'dayjs';

export const accessColumn = ({ handleEdit, handleDelete, handleView }) => [
  {
    title: "รหัสลูกค้า",
    key: "cuscode",
    dataIndex: "cuscode",
    width: "8%",
    align: "left",
    sorter: (a, b) => (a?.cuscode || "").localeCompare(b?.cuscode || ""),
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "cusname",
    key: "cusname",
    width: "26%",
    sorter: (a, b) => (a?.cusname || "").localeCompare(b?.cusname || ""),
  },
  {
    title: "จังหวัด",
    dataIndex: "province",
    key: "province",
    width: "12%",
    sorter: (a, b) => (a?.province || "").localeCompare(b?.province || ""),
  },
  {
    title: "สาขา",
    dataIndex: "branch",
    key: "branch",
    width: "12%",
    sorter: (a, b) => (a?.branch || "").localeCompare(b?.branch || ""),
  },
  {
    title: "เขตขนส่ง",
    dataIndex: "county_name",
    key: "county_name",
    width: "12%",
    sorter: (a, b) => (a?.county_name || "").localeCompare(b?.county_name || ""),
    render: (v) => v || "-",
  },
  {
    title: "เครดิต (วัน)",
    dataIndex: "credit_day",
    key: "credit_day",
    width: "8%",
    align: "right",
    sorter: (a, b) => Number(a?.credit_day || 0) - Number(b?.credit_day || 0),
    render: (v) => (v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString()),
  },
  {
    title: "สถานะ",
    dataIndex: "active_status",
    key: "active_status",
    width: "12%",
    sorter: (a, b) => (a?.active_status || "").localeCompare(b?.active_status || ""),
    render: (data) => (
      <div style={{ whiteSpace: "nowrap" }}>
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
  /* ชื่อภาษาอังกฤษ (ใช้บนใบส่งสินค้า) และจำนวนวันเครดิตของลูกค้า */
  cusname_en: null,
  credit_day: null,
  email: null,
  active_status: "Y",
};
