import { Button, Space } from "antd"; 
import "../../assets/styles/banks.css"
// import { Typography } from "antd"; 
// import { Popconfirm, Button } from "antd";
import { Tooltip,Image } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons"; 
import { TagPurchaseOrderStatus } from "../../components/badge-and-tag";
import { EditableRow, EditableCell } from "../../components/table/TableEditAble";
import dayjs from 'dayjs';
import { EditOutlined } from "@ant-design/icons";
import { comma,BACKEND_URL_MAIN } from '../../utils/util';

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
    title: "รหัสใบสั่งซื้อ",
    key: "pocode",
    dataIndex: "pocode",
    align: "left",
    sorter: (a, b) => (a.pocode).localeCompare(b.pocode),
    width:140,
  },
  {
    title: "วันที่ใบสั่งซื้อ",
    dataIndex: "podate",
    key: "podate",
    width: 140,
    sorter: (a, b) => (a.podate).localeCompare(b.podate),
    render: (v) => dayjs(v).format("DD/MM/YYYY"),
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "supcode",
    key: "supcode",
    width: 120,
    sorter: (a, b) => (a.supcode).localeCompare(b.supcode),
  },
  {
    title: "ชื่อลูกค้า",
    dataIndex: "supname",
    key: "supname", 
    sorter: (a, b) => (a.supname).localeCompare(b.supname),
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
    render: (data) => <TagPurchaseOrderStatus result={data} />,
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
        {/* <Button
          icon={<PrinterOutlined />} 
          className='bn-warning-outline'
          style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          onClick={(e) => handlePrint(record) }
          size="small"
        />         */}
        {/* <ButtonAttachFiles code={record.srcode} refs='Sample Request' showExpire={true} /> */}
      </Space>
    ),
  }, 
];

export const productColumn = ({handleRemove},optionsItems) => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    align: "center",
    width: 60, 
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "รูปประกอบ",
    dataIndex: "file",
    key: "file",
    width: 120,
    align: "center",
    render: (im, rec) => 
      {
        const img = (!!rec.file_name ? `/uploads/` + rec.file_name : `/Logo-AI.png`
        );
        return <>
        <Image
      style={{ borderRadius: 10 }}
      preview={false}
      height={75}
      alt={`Image ${rec.file_name}`}
      src={`${BACKEND_URL_MAIN}` + img}
    />
    </>
    },
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: 140, 
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
    title: "จำนวนที่รับแล้ว",
    dataIndex: "recamount",
    key: "recamount",
    width: "8%",
    align: "right",
    className: "!pe-3",
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
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.qty ||  0),  2, 2 )}</>,
  },
  {
    title: "ราคาซื้อ",
    dataIndex: "price",
    key: "price", 
    width: "8%",
    align: "right",
    className: "!pe-3",
    editable: true,
    required: true,
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.price ||  0),  2, 2 )}</>,
  },
  {
    title: "หน่วยสินค้า",
    dataIndex: "unit",
    key: "unit", 
      align: "right", 
      width: "8%",
      editable: true,
      type:'select',    
      optionsItems,
      render: (v) => {
        return optionsItems?.find( f  => f.value === v )?.label
      },
  },
  {
    title: "ส่วนลด(%)",
    dataIndex: "discount",
    key: "discount",
    width: "7%",
    align: "right",
    className: "!pe-3",
    editable: true,
    type:'number',
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
  {
    title: "ตัวเลือก",
    align: "center",
    key: "operation",
    dataIndex: "operation",
    render: (_, record, idx) => handleRemove(record),
    width: '80px',
    fixed: 'right',
  },
];

export const columnsParametersEditable = (handleEditCell,optionsItems,{handleRemove} ) =>{
  const col = productColumn({handleRemove},optionsItems);
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
export const purchaseorderForm = {
  pocode: null,
  podate: null,
  supcode: null,
  supname: null,
  deldate: null,
  contact: null,
  supcontact: null,
  supaddress: null,
  tel: null,
  remark: null,
  total_price: 0,
  vat: 7,
  grand_total_price: 0,
}

export const purchaseorderDetailForm = {  
  pocode : null,
  stcode : null,
  stname : null,  
  discount : 0,
  qty : 0,
  price : 0,
  unit: null,
}


