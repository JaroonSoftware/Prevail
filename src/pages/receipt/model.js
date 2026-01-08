import { Button, Space } from "antd"; 
// import { Typography } from "antd"; 
// import { Popconfirm, Button } from "antd";
import { Tooltip,Badge } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons"; 
import { EditableRow, EditableCell } from "../../components/table/TableEditAble";
import { TagReceiptStatus } from "../../components/badge-and-tag/";
import { TagsCreateBy } from "../../components/badge-and-tag/";
import dayjs from 'dayjs';
import {  EditOutlined, PrinterOutlined,ExclamationCircleOutlined } from "@ant-design/icons";
import { comma,formatMoney } from '../../utils/util';

const calTotalDiscount = (rec) => {
  const total_price =  Number(rec?.total_price ||  0);
  const discount =  Number(rec?.discount ||  0);

  return total_price - discount;
}
/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

/** get sample column */
export const accessColumn = ({handleEdit, handleDelete, handleView, handlePrint}) => [
  {
    title: "เลขที่ใบเสร็จรับเงิน",
    key: "recode",
    dataIndex: "recode",
    align: "left",
    sorter: (a, b) => (a.ivcode).localeCompare(b.ivcode),
    width:140,
  },
  {
    title: "วันที่ใบเสร็จรับเงิน",
    dataIndex: "redate",
    key: "redate",
    width: 140,
    sorter: (a, b) => (a.qtdate).localeCompare(b.qtdate),
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: 120,
    sorter: (a, b) => (a.cuscode).localeCompare(b.cuscode),
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "cusname",
    key: "cusname", 
    sorter: (a, b) => (a.cusname).localeCompare(b.cusname),
    ellipsis: {
      showTitle: false,
    },
    render: (v) => <Tooltip placement="topLeft" title={v}>{v}</Tooltip>, 
  },
  {
    title: "สถานะ",
    dataIndex: "doc_status",
    key: "doc_status", 
    width: '13%',
    sorter: (a, b) => a.doc_status.localeCompare(b.doc_status),
    sortDirections: ["descend", "ascend"],
    render: (data) => <TagReceiptStatus result={data} />,
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
    fixed: 'right',
    width: 100,
    render: (text, record) => (
      <Space >
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
          className='bn-primary-outline'
          style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          onClick={(e) => handleEdit(record) }
          size="small"
        />
        <Button
          icon={<PrinterOutlined />} 
          className='bn-warning-outline'
          style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          onClick={(e) => handlePrint(record) }
          size="small"
        />        
        {/* <ButtonAttachFiles code={record.srcode} refs='Sample Request' showExpire={true} /> */}
      </Space>
    ),
  }, 
];

export const reViewColumns = [
  {
    title: "ลำดับ",
    key: "__no",
    width: 80,
    align: "center",
    render: (_, __, index) => index + 1,
  },
  {
    title: "เลขที่ใบวางบิล",
    dataIndex: "blcode",
    key: "blcode",
    align: "left",
    width: 160,
  },
  {
    title: "ราคา",
    dataIndex: "total_price",
    key: "total_price",
    align: "right",
    width: 140,
    className: "!pe-3",
    render: (v) => formatMoney(Number(v || 0), 2),
  },
  {
    title: "ส่วนลด",
    dataIndex: "discount",
    key: "discount",
    align: "right",
    width: 120,
    className: "!pe-3",
    render: (v) => formatMoney(Number(v || 0), 2),
  },
  {
    title: "ราคารวม",
    dataIndex: "grand_total_price",
    key: "grand_total_price",
    align: "right",
    width: 160,
    className: "!pe-3",
    render: (_, rec) => <>{ comma( (Number(rec?.total_price ||  0) - Number(rec?.discount ||  0) ),  2, 2 )}</>,
  },
];

    // Add: view-only payment columns (inline for now)
export const rePaymentViewColumns = [
  {
    title: "ลำดับ",
    key: "__no",
    width: 80,
    align: "center",
    render: (_, __, index) => index + 1,
  },
  {
    title: "ธนาคาร",
    dataIndex: "bank_name_th",
    key: "bank_name_th",
    align: "left",
    // Fallbacks if the API provides a different shape
    render: (_, rec) => rec?.bank_name_th || rec?.bank_name || rec?.bank || "-",
  },
  {
    title: "เลขที่บัญชี",
    dataIndex: "acc_no",
    key: "acc_no",
    align: "left",
    width: 160,
  },
  {
    title: "ชื่อบัญชี",
    dataIndex: "acc_name",
    key: "acc_name",
    align: "left",
  },
  {
    title: "จำนวนเงิน",
    dataIndex: "amount",
    key: "amount",
    align: "right",
    width: 160,
    className: "!pe-3",
    render: (v) => formatMoney(Number(v || 0), 2),
  },
  {
    title: "หมายเหตุ",
    dataIndex: "remark",
    key: "remark",
    align: "left",
  },
];

export const productColumn = ({handleRemove}) => [
  {
    title: "ลำดับ",
    dataIndex: "code",
    key: "code",
    align: "center",
    width: "10%",
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "เลขที่ใบวางบิล",
    dataIndex: "blcode",
    key: "blcode",
    align: "center",
  },
  {
    title: "วันที่ใบวางบิล",
    key: "bldate",
    width: "10%",
    dataIndex: "bldate", 
  },
  {
    title: "ราคา",
    dataIndex: "total_price",
    key: "total_price", 
    width: "10%",
    align: "right",
    className: "!pe-3",
    required: true,
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.total_price ||  0),  2, 2 )}</>,
  },
  {
    title: "ส่วนลด",
    dataIndex: "discount",
    key: "discount",
    width: "10%",
    align: "right",
    className: "!pe-3",
    editable: true,
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.discount ||  0),  2, 2 )}</>,
  },
  {
    title: "ราคารวม",
    dataIndex: "grand_total_price",
    key: "grand_total_price",
    width: "10%",
    align: "right",
    className: "!pe-3",
    render: (_, rec) => <>{ comma( (Number(rec?.total_price ||  0) - Number(rec?.discount ||  0)),  2, 2 )}</>,
  },
  {
    title: "ตัวเลือก",
    align: "center",
    key: "operation",
    dataIndex: "operation",
    render: (_, record, idx) => handleRemove(record),
    width: '90px',
    fixed: 'right',
  },
];

export const columnsParametersEditable = (handleEditCell,{handleRemove} ) =>{
  const col = productColumn({handleRemove});
  return col.map((col, ind) => {
      if (!col.editable) return col; 
      
      return {
          ...col,
          onCell: (record) => {
            return {
              record,
              editable: col.editable,
              dataIndex: col.dataIndex,
              title: col.title,
              type: col?.type || "input",
              handleEditCell,
            }
          },
      };
  }); 
}
export const DEFALUT_CHECK_RECEIPT = {
  recode: null,
  redate: null,
  ivcode: null,  
  cuscode: null,
  remark: null,
  branch: null,
  check_no: null,
  check_amount: 0,
  price: 0,
}


