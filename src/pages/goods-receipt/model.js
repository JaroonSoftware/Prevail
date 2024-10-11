import { Button, Space } from "antd"; 
import "../../assets/styles/banks.css"
// import { Typography } from "antd"; 
// import { Popconfirm, Button } from "antd";
import { Tooltip,Image } from "antd";
// import { EditOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons"; 

// import { TagGoodsReceiptStatus } from "../../components/badge-and-tag";
import { EditableRow, EditableCell } from "../../components/table/TableEditAble";
import dayjs from 'dayjs';
import { EditOutlined } from "@ant-design/icons";
import { comma,BACKEND_URL_MAIN } from '../../utils/util';

/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

/** get sample column */
export const accessColumn = ({handleEdit, handleDelete, handleView, handlePrint}) => [
  {
    title: "รหัสใบรับสินค้า",
    key: "grcode",
    dataIndex: "grcode",
    align: "left",
    sorter: (a, b) => (a.grcode).localeCompare(b.grcode),
    width:140,
  },
  {
    title: "วันที่ใบรับสินค้า",
    dataIndex: "qtdate",
    key: "qtdate",
    width: 140,
    sorter: (a, b) => (a.qtdate).localeCompare(b.qtdate),
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
  // {
  //   title: "สถานะ",
  //   dataIndex: "doc_status",
  //   key: "doc_status", 
  //   width: '13%',
  //   sorter: (a, b) => a.doc_status.localeCompare(b.doc_status),
  //   sortDirections: ["descend", "ascend"],
  //   render: (data) => <TagGoodsReceiptStatus result={data} />,
  // },
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
    width: 80, 
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
    title: "ใบสั่งซื้อ",
    dataIndex: "pocode",
    key: "pocode",
    width: 120, 
    align: "center",
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
    title: "ราคาต่อหน่วย",
    dataIndex: "price",
    key: "price", 
    width: "10%",
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
      optionsItems,
      render: (v) => {
        return optionsItems?.find( f  => f.value === v )?.label
      },
  },
  {
    title: "จำนวนที่สั่ง",
    dataIndex: "qty_buy",
    key: "qty_buy", 
    width: "10%",
    align: "right",
    className: "!pe-3",
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.qty_buy ||  0),  2, 2 )}</>,
  },  
  {
    title: "จำนวนที่รับแล้ว",
    dataIndex: "recamount",
    key: "recamount", 
    width: "10%",
    align: "right",
    className: "!pe-3",
    type:'number',
    render: (_, rec) => <>{ comma( Number(rec?.recamount ||  0),  2, 2 )}</>,
  }, 
  {
    title: "จำนวนที่จะรับ",
    dataIndex: "qty",
    key: "qty", 
    width: "10%",
    align: "right",
    className: "!pe-3",
    editable: true,
    required: true,
    type:'number',
    onCell: (rec) => {
      const isamount = (Number(rec?.qty || 0) > 0 && Number(rec?.qty || 0) >= Number(rec?.qty_buy || 0) ) ? 'text-green-700' : 'text-red-600'
      return {
        className: `!pe-3 field-edit !bg-gray-300 ${isamount}`
      }
    },
    render: (_, rec) => <>{comma(Number(rec?.qty || 0))}</>,
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
  const col = productColumn({handleRemove},optionsItems);
  return col.map((col, ind) => {
      if (!col.editable) return col; 

            
      return {
          ...col,
          onCell: (record) => {
            // console.log(record);
            let prop = {};
            if( col?.type === 'number' && col.dataIndex === 'qty' )
              prop = { max:Number((record?.qty) || 0)};
            return {
              record,
              editable: col.editable,
              dataIndex: col.dataIndex,
              title: col.title,
              // required: !!col?.required,
              type: col?.type || "input",
              handleEditCell,
              optionsItems,
              childProps: prop,
            }
          },
      };
  }); 
}
export const goodsreceiptForm = {
  grcode: null,
  grdate: null,
  supcode: null,
  supname: null,
  contact: null,
  supcontact: null,
  supaddress: null,
  tel: null,
  remark: null,
  total_price: 0,
  vat: 7,
  grand_total_price: 0,
}

export const goodsreceiptDetailForm = {  
  grcode : null,
  stcode : null,
  stname : null,  
  discount : 0,
  qty : 0,
  price : 0,
  unit: null,
}


