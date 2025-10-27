import { Button, Space } from "antd"; 
import "../../assets/styles/banks.css"
// import { Typography } from "antd"; 
// import { Popconfirm, Button } from "antd";
import { Tooltip } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons"; 
import { EditableRow, EditableCell } from "../../components/table/TableEditAble";
import { TagReceiptStatus } from "../../components/badge-and-tag/";
import { TagsCreateBy } from "../../components/badge-and-tag/";
import dayjs from 'dayjs';
import {  EditOutlined, PrinterOutlined } from "@ant-design/icons";
import { comma } from '../../utils/util';

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
        <Button
          icon={<EditOutlined />} 
          className='bn-primary-outline'
          style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          onClick={(e) => handleEdit(record) }
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
    title: "ส่วนลด(%)",
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
    render: (_, rec) => <>{ comma( calTotalDiscount(rec),  2, 2 )}</>,
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

export const columnsParametersEditable = (handleEditCell,optionsItems,{handleRemove} ) =>{
  const col = productColumn({handleRemove});
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


