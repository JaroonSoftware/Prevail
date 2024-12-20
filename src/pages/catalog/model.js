import { Button, Space, Badge } from "antd";
import "../../assets/styles/banks.css";
import { Tooltip } from "antd";
import {
  EditableRow,
  EditableCell,
} from "../../components/table/TableEditAble";
import { EditOutlined } from "@ant-design/icons";
import { comma } from '../../utils/util';

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

export const CatalogProductColumn = ({ handleRemove }) => [
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
    title: "ราคาขาย (บาท)",
    dataIndex: "price",
    key: "price", 
    width: "15%",
    align: "left",
    className: "!pe-3",
    editable: true,
    required: true,
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.price ||  0),  2, 2 )}</>,
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

export const columnsParametersEditable = (handleEditCell,{handleRemove} ) =>{
  const col = CatalogProductColumn({handleRemove},);
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
            }
          },
      };
  }); 
}
export const CatalogCustomerColumn = ({ handleRemoveCustomer }) => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    align: "center",
    width: "5%",
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: "10%",
    align: "center",
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "cusname",
    key: "cusname",
    align: "left",
    width: "50%",
    render: (_, rec) => rec.prename + rec.cusname,
  },
  {
    title: "ตัวเลือก",
    align: "center",
    key: "operation",
    dataIndex: "operation",
    render: (_, record, idx) => handleRemoveCustomer(record),
    width: "4%",
    fixed: "right",
  },
];
export const columnsParametersEditableCustomer = (handleEditCellCustomer,{handleRemoveCustomer} ) =>{
  const col = CatalogCustomerColumn({handleRemoveCustomer});
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
              handleEditCellCustomer,
            }
          },
      };
  }); 
}
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
