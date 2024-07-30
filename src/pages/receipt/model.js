import { Button, Space } from "antd"; 
import "../../assets/styles/banks.css"
// import { Typography } from "antd"; 
// import { Popconfirm, Button } from "antd";
import { Tooltip } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons"; 
import { EditableRow, EditableCell } from "../../components/table/TableEditAble";
import { TagReceiptStatus } from "../../components/badge-and-tag/";
import dayjs from 'dayjs';
import {  EditOutlined, PrinterOutlined } from "@ant-design/icons";
import { comma } from '../../utils/util';

const calTotalDiscount = (rec) => {
  const total =  Number(rec?.qty ||  0) * Number(rec?.price ||  0);
  const discount = 1 - ( Number(rec?.discount ||  0) / 100 );

  return total * discount;
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
    width: '15%',
    sorter: (a, b) => (a.created_name).localeCompare(b.created_name),
    ellipsis: {
      showTitle: false,
    },
    render: (v) => <Tooltip placement="topLeft" title={v}>{v}</Tooltip>, 
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

export const productColumn = ({handleRemove,handleSelectChange}) => [
  {
    title: "ลำดับ",
    dataIndex: "code",
    key: "code",
    align: "center",
    width: 80, 
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: 120, 
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
    width: "8%",
    align: "right",
    className: "!pe-3",
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.qty ||  0),  0, 0 )}</>,
  },
  {
    title: "ราคาขาย",
    dataIndex: "price",
    key: "price", 
    width: "8%",
    align: "right",
    className: "!pe-3",
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.price ||  0),  2, 2 )}</>,
  },
  {
    title: "หน่วยสินค้า",
    dataIndex: "unit",
    key: "unit", 
      align: "right", 
      width: "8%",
      type:'select',    
  },
  {
    title: "ส่วนลด(%)",
    dataIndex: "discount",
    key: "discount",
    width: "10%",
    align: "right",
    className: "!pe-3",
    render: (_, rec) => <>{ comma( Number(rec?.discount ||  0),  2, 2 )}</>,
  },
  {
    title: "ราคารวม",
    dataIndex: "total",
    key: "total",
    width: "10%",
    align: "right",
    className: "!pe-3",
    render: (_, rec) => <>{ comma( calTotalDiscount(rec),  2, 2 )}</>,
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


