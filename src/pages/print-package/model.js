import { Button, Space } from "antd";
import "../../assets/styles/banks.css";
// import { Typography } from "antd";
// import { Popconfirm, Button } from "antd";
import { Tooltip } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  EditableRow,
  EditableCell,
} from "../../components/table/TableEditAble";
import dayjs from "dayjs";
import { BarcodeOutlined } from "@ant-design/icons";
import { comma } from "../../utils/util";
import { TagsCreateBy } from "../../components/badge-and-tag/";
import { TagSalesOrderStatus } from "../../components/badge-and-tag";

const calTotalDiscount = (rec) => {
  const total = Number(rec?.qty || 0) * Number(rec?.price || 0);
  const discount = 1 - Number(rec?.discount || 0) / 100;

  return total * discount;
};
/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

/** get sample column */
export const accessColumn = ({ handleEdit, handleView, handlePrintsData }) => [
  {
    title: "รหัสใบขายสินค้า",
    key: "socode",
    dataIndex: "socode",
    align: "left",
    sorter: (a, b) => a.socode.localeCompare(b.socode),
    width: 140,
  },
  {
    title: "วันที่ใบขายสินค้า",
    dataIndex: "sodate",
    key: "sodate",
    width: 140,
    sorter: (a, b) => a.sodate.localeCompare(b.sodate),
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: 120,
    sorter: (a, b) => a.cuscode.localeCompare(b.cuscode),
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "cusname",
    key: "cusname",
    sorter: (a, b) => a.cusname.localeCompare(b.cusname),
    ellipsis: {
      showTitle: false,
    },
    render: (v) => (
      <Tooltip placement="topLeft" title={v}>
        {v}
      </Tooltip>
    ),
  },
  {
    title: "สถานะ",
    dataIndex: "doc_status",
    key: "doc_status",
    width: "13%",
    sorter: (a, b) => a.doc_status.localeCompare(b.doc_status),
    sortDirections: ["descend", "ascend"],
    render: (data) => <TagSalesOrderStatus result={data} />,
  },
  {
    title: "จัดทำโดย",
    dataIndex: "created_name",
    key: "created_name",
    sorter: (a, b) => a.created_name.localeCompare(b.created_name),
    width: "15%",
    ellipsis: {
      showTitle: false,
    },
    render: (data, role) => <TagsCreateBy result={data} role={role} />,
  },
  {
    title: "Action",
    key: "operation",
    fixed: "right",
    width: 20,
    render: (text, record) => (
      <Space>
        <Button
          icon={<BarcodeOutlined />}
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

export const productColumn = ({ handleRemove, handleSelectChange }) => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    width: 80,
    align: "center",
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: 120,
    align: "left",
  },
  {
    title: "ชื่อสินค้า",
    dataIndex: "purdetail",
    key: "purdetail",
    align: "left",
    render: (_, rec) => rec.stname,
  },
  {
    title: "จำนวน",
    dataIndex: "qty",
    key: "qty",
    width: "8%",
    align: "right",
    className: "!pe-3",
    required: true,
    render: (_, rec) => <>{comma(Number(rec?.qty || 0), 2, 2)}</>,
  },
  {
    title: "ราคาขาย",
    dataIndex: "price",
    key: "price",
    width: "8%",
    align: "right",
    className: "!pe-3",
    // editable: true,
    // required: true,
    // type: "number",
    render: (_, rec) => <>{comma(Number(rec?.price || 0), 2, 2)}</>,
  },
  {
    title: "หน่วยสินค้า",
    dataIndex: "unit",
    key: "unit",
    align: "right",
    width: "8%",
    // editable: true,
    // type: "select",
  },
  {
    title: "ส่วนลด(%)",
    dataIndex: "discount",
    key: "discount",
    width: "10%",
    align: "right",
    className: "!pe-3",
    // editable: true,
    // type: "number",
    render: (_, rec) => <>{comma(Number(rec?.discount || 0), 2, 2)}</>,
  },
  {
    title: "ราคารวม",
    dataIndex: "total",
    key: "total",
    width: "10%",
    align: "right",
    className: "!pe-3",
    render: (_, rec) => <>{comma(calTotalDiscount(rec), 2, 2)}</>,
  },
  {
    title: "VAT (%)",
    dataIndex: "vat",
    key: "vat",
    width: "8%",
    align: "right",
    className: "!pe-3",
    // editable: true,
    // required: true,
    // type: "number",
    render: (_, rec) => <>{comma(Number(rec?.vat || 0), 2, 2)}</>,
  },
  {
    title: "ราคารวมสุทธิ",
    dataIndex: "totalnet",
    key: "totalnet",
    width: "8%",
    align: "right",
    className: "!pe-3",
    render: (_, rec) => (
      <>
        {comma(
          calTotalDiscount(rec) + calTotalDiscount(rec) * (rec.vat / 100),
          2,
          2
        )}
      </>
    ),
  },
];

export const columnsParametersEditable = (
  handleEditCell,
  optionsItems,
  { handleRemove }
) => {
  const col = productColumnInCollape({ handleRemove });
  return col.map((col, ind) => {
    if (!col.editable) return col;

    return {
      ...col,
      onCell: (record) => {
        // console.log(record);
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          // required: !!col?.required,
          type: col?.type || "input",
          handleEditCell,
          optionsItems,
        };
      },
    };
  });
};

export const productColumnInCollape = () => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    width: "5%",
    align: "center",
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: "8%",
    align: "center",
  },
  {
    title: "ชื่อสินค้า",
    dataIndex: "purdetail",
    key: "purdetail",
    align: "left",
    render: (_, rec) => rec.stname,
  },
  {
    title: "จำนวน",
    dataIndex: "qty",
    key: "qty",
    width: "10%",
    align: "right",
    className: "!pe-3",
    render: (_, rec) => <>{comma(Number(rec?.qty || 0), 2, 2)}</>,
  },
  {
    title: "น้ำหนักสูงสุดต่อถุง",
    dataIndex: "packing_weight",
    key: "packing_weight",
    width: "10%",
    align: "right",
    className: "!pe-3",
    required: true,
  },
  {
    title: "หน่วยสินค้า",
    dataIndex: "unit",
    key: "unit",
    align: "center",
    width: "10%",
    // editable: true,
    // type: "select",
  },
];

export const columnsParametersInCollape = (
  handleEditCell,
  optionsItems,
  { handleRemove }
) => {
  const col = productColumn({ handleRemove });
  return col.map((col, ind) => {
    if (!col.editable) return col;

    return {
      ...col,
      onCell: (record) => {
        // console.log(record);
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          // required: !!col?.required,
          type: col?.type || "input",
          handleEditCell,
          optionsItems,
        };
      },
    };
  });
};
export const soForm = {
  socode: null,
  sodate: null,
  cuscode: null,
  cusname: null,
  contact: null,
  cuscontact: null,
  cusaddress: null,
  tel: null,
  remark: null,
  active_status: null,
  total_price: 0,
  vat: 7,
  grand_total_price: 0,
};

export const quotationDetailForm = {
  qtcode: null,
  stcode: null,
  stname: null,
  discount: 0,
  qty: 0,
  price: 0,
  unit: null,
};
