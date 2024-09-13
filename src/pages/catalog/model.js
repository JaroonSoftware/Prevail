import { Button, Space, Badge } from "antd";
import "../../assets/styles/banks.css";
import { Tooltip } from "antd";
import {
  EditableRow,
  EditableCell,
} from "../../components/table/TableEditAble";
import { EditOutlined } from "@ant-design/icons";

/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

/** get sample column */
export const accessColumn = ({
  handleEdit,
  handleDelete,
  handleView,
  handlePrint,
}) => [
  {
    title: "รหัสแคตตาล๊อก",
    key: "catalog_code",
    dataIndex: "catalog_code",
    align: "left",
    sorter: (a, b) => a.cm.catalog_code.localeCompare(b.cm.catalog_code),
    width: 140,
  },
  {
    title: "ชื่อแคตตาล๊อก",
    dataIndex: "catalog_name",
    key: "catalog_name",
    sorter: (a, b) => a.catalog_name.localeCompare(b.catalog_name),
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
    fixed: "center",
    width: "5%",
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

export const CatalogProductColumn = ({ handleRemove }, optionsItems) => [
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

export const columnsParametersEditable = (
  handleEditCell,
  optionsItems,
  { handleRemove }
) => {
  const col = CatalogProductColumn({ handleRemove }, optionsItems);
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
          handleEditCell,
          optionsItems,
        };
      },
    };
  });
};
export const purchaseorderForm = {
  clcode: null,
  cldate: null,
  tel: null,
};

export const purchaseorderDetailForm = {
  pocode: null,
  stcode: null,
  stname: null,
  unit: null,
};
