import { Button, Space,Badge } from "antd";
import "../../assets/styles/banks.css";
import { Tooltip } from "antd";
import {
  EditableRow,
  EditableCell,
} from "../../components/table/TableEditAble";
import { TagDeliveryNoteStatus } from "../../components/badge-and-tag";
import dayjs from "dayjs";
import { EditOutlined, PrinterOutlined } from "@ant-design/icons";
import { BarcodeOutlined } from "@ant-design/icons";

/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

/** get sample column */
export const accessColumn = ({
  handleEdit,
  handleDelete,
  handleView,
  handlePrintsData,
}) => [
  {
    title: "เลขที่ใบส่งของ",
    key: "dncode",
    dataIndex: "dncode",
    align: "left",
    sorter: (a, b) => a.dncode.localeCompare(b.dncode),
    width: 140,
  },
  {
    title: "วันที่ใบส่งของ",
    dataIndex: "dndate",
    key: "dndate",
    width: 140,
    sorter: (a, b) => a.qtdate.localeCompare(b.qtdate),
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
    render: (data) => <TagDeliveryNoteStatus result={data} />,
  },
  {
    title: "Action",
    key: "operation",
    fixed: "right",
    width: 100,
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

        {/* <Popconfirm 
          placement="topRight"
          title="Sure to delete?"  
          description="Are you sure to delete this packaging?"
          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          onConfirm={() => handleDelete(record)}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            size="small"
          />
        </Popconfirm> */}
        <Button
          icon={<PrinterOutlined />}
          className="bn-warning-outline"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => handlePrintsData(record.dncode)}
          size="small"
        />
        {/* <ButtonAttachFiles code={record.srcode} refs='Sample Request' showExpire={true} /> */}
      </Space>
    ),
  },
];

export const productColumn = ({ handleScan }) => [
  // {
  //   title: "ลำดับ",
  //   dataIndex: "code",
  //   key: "code",
  //   align: "center",
  //   width: 80,
  //   render: (im, rc, index) => <>{index + 1}</>,
  // },
  // {
  //   title: "รหัสสินค้า",
  //   dataIndex: "dncode",
  //   key: "dncode",
  //   width: 120,
  //   align: "center",
  // },
  {
    title: "ชื่อสินค้า",
    dataIndex: "stname",
    key: "stname",
    align: "left",
  },
  {
    title: "จำนวนส่ง",
    dataIndex: "qty",
    key: "qty",
    align: "center",
    width: "10%",
  },
  {
    title: "ส่งแล้ว",
    dataIndex: "del_qty",
    key: "del_qty",
    align: "center",
    width: "10%",
    render: (_, rec) => (
            <div>
              {parseFloat(rec.del_qty)-parseFloat(rec.qty)<0 ? (
                <Badge status="error" text={rec.del_qty} />
              ) : (
                <Badge status="success" text={rec.del_qty} />
              )}
            </div>
          ),
  },
  {
    title: "แสกนสินค้า",
    key: "operation",
    width: "5%",
    fixed: "right",
    render: (text, record) => (
      <Space style={{ paddingLeft: 25 }}>
        <Button
          icon={<BarcodeOutlined />}
          className="bn-primary-outline"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => handleScan(record)}
          size="small"
        />
      </Space>
    ),
  },
];
export const columnsParametersEditable = (
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
export const DEFALUT_CHECK_DELIVERY = {
  dncode: null,
  dndate: null,
  qtcode: null,
  payment: null,
  cuscode: null,
  remark: null,
  total_weight: 0,
};
