import { Button, Space } from "antd";
import "../../assets/styles/banks.css";
// import { Typography } from "antd";
// import { Popconfirm, Button } from "antd";
import { Tooltip,Badge } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  EditableRow,
  EditableCell,
} from "../../components/table/TableEditAble";
import { TagDeliveryNoteStatus } from "../../components/badge-and-tag";
import { TagsCreateBy } from "../../components/badge-and-tag/";
import dayjs from "dayjs";
import { EditOutlined, PrinterOutlined,ExclamationCircleOutlined } from "@ant-design/icons";
import { comma,formatMoney } from "../../utils/util";
import { TbBasketCheck } from "react-icons/tb";

const calTotalDiscount = (rec) => {
  const total = Number(rec?.qty || 0) * Number(rec?.price || 0);

  return total;
};
/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

/** get sample column */
export const accessColumn = ({
  handleEdit,
  handleDelete,
  handleView,
  handleIssue,
  handlePrintsData,
}) => [
  {
    title: "เลขที่ใบส่งของ",
    key: "dncode",
    dataIndex: "dncode",
    align: "left",
    sorter: (a, b) => a.dncode.localeCompare(b.dncode),
    width: 120,
  },
  {
    title: "วันที่ใบส่งของ",
    dataIndex: "dndate",
    key: "dndate",
    width: 120,
    sorter: (a, b) => a.qtdate.localeCompare(b.qtdate),
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: 100,
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
    title: "สถานะตัดสต๊อก",
    dataIndex: "issue_status",
    key: "issue_status",
    width: "13%",
    sorter: (a, b) => a.issue_status.localeCompare(b.issue_status),
    sortDirections: ["descend", "ascend"],
    render: (data) => <TagDeliveryNoteStatus result={data} />,
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
    title: "จัดทำโดย",
    dataIndex: "created_name",
    key: "created_name",
    sorter: (a, b) => a.created_name.localeCompare(b.created_name),
    width: "13%",
    ellipsis: {
      showTitle: false,
    },
    render: (data, role) => <TagsCreateBy result={data} role={role} />,
  },
  {
    title: "Action",
    key: "operation",
    fixed: "right",
    width: 100,
    render: (text, record) => (
      <Space>
        <Badge size="small" offset={[0, 1]}>
            <Button
              icon={<ExclamationCircleOutlined />}
              className="bn-success-outline"
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => handleView(record)}
              size="small"
            />
        </Badge>
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
        { record.issue_status  === 'ยังไม่ตัดสต๊อก' && 
        <Button
          icon={<TbBasketCheck style={{ fontSize: "1rem" }} />}
          className="bn-success-outline"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => handleIssue(record)}
          size="small"
        >
        </Button>
        }   
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

export const productColumn = ({ handleRemove, handleSelectChange }) => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    width: 80,
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "ใบขายสินค้า",
    dataIndex: "socode",
    key: "socode",
    width: "8%",
    align: "right",
    className: "!pe-3",
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
    dataIndex: "stname",
    key: "stname",
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
    editable: true,
    required: true,
    type: "number",
    render: (_, rec) => <>{comma(Number(rec?.qty || 0), 2, 2)}</>,
  },
  {
    title: "ราคาขาย",
    dataIndex: "price",
    key: "price",
    width: "8%",
    align: "right",
    className: "!pe-3",
    editable: true,
    required: true,
    type: "number",
    render: (_, rec) => <>{comma(Number(rec?.price || 0), 2, 2)}</>,
  },
  {
    title: "หน่วยสินค้า",
    dataIndex: "unit",
    key: "unit",
    align: "right",
    width: "8%",
    editable: true,
    type: "select",
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
    title: "ตัวเลือก",
    align: "center",
    key: "operation",
    dataIndex: "operation",
    render: (_, record, idx) => handleRemove(record),
    width: "90px",
    fixed: "right",
  },
];

export const soViewColumns = [
      {
        title: "ลำดับ",
        key: "__no",
        width: 80,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "รหัสสินค้า",
        dataIndex: "stcode",
        key: "stcode",
        width: 140,
        align: "left",
      },
      {
        title: "ชื่อสินค้า",
        key: "stname",
        align: "left",
        render: (_, rec) => rec?.stname || rec?.purdetail || "-",
      },
      {
        title: "จำนวน",
        dataIndex: "qty",
        key: "qty",
        align: "right",
        width: 120,
        className: "!pe-3",
        render: (v) => formatMoney(Number(v || 0), 2),
      },
      {
        title: "ราคาขาย",
        dataIndex: "price",
        key: "price",
        align: "right",
        width: 140,
        className: "!pe-3",
        render: (v) => formatMoney(Number(v || 0), 2),
      },
      {
        title: "หน่วยสินค้า",
        dataIndex: "unit",
        key: "unit",
        align: "right",
        width: 120,
      },
      {
        title: "ราคารวม",
        key: "total",
        align: "right",
        width: 140,
        className: "!pe-3",
        render: (_, rec) =>
          formatMoney(Number(rec?.qty || 0) * Number(rec?.price || 0), 2),
      },
      {
        title: "VAT (%)",
        dataIndex: "vat",
        key: "vat",
        align: "right",
        width: 100,
        className: "!pe-3",
        render: (v) => Number(v || 0),
      },
      {
        title: "ราคารวมสุทธิ",
        key: "totalnet",
        align: "right",
        width: 160,
        className: "!pe-3",
        render: (_, rec) => {
          const base = Number(rec?.qty || 0) * Number(rec?.price || 0);
          const net = base * (1 + Number(rec?.vat || 0) / 100);
          return formatMoney(net, 2);
        },
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
