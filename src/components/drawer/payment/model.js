import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/util';
import { Typography } from 'antd';
// import { PoStatus } from '../../components/badge-and-tag/purchase-order';
// import TagIs from '../../components/badge-and-tag/tags-is/TagIs';

import { EditableRow, EditableCell } from "../../table/TableEditAble";

// const calRemain = (rec) => {
//   const remain =  Number(rec?.qty ||  0) - Number(rec?.received ||  0) - Number(rec?.amount ||  0);
//   return remain;
// }

/** export component for edit table */
export const componentsEditable = {
  body: { row: EditableRow, cell: EditableCell },
};

export const accessColumn = ({handleAction}) => [
  // {
  //   title: "ลำดับ",
  //   dataIndex: "seq",
  //   key: "seq",
  //   width: "5%",
  //   align: "center",
  //   render: (v) => <Typography.Text>{v}</Typography.Text>,
  // },
  {
    title: "ลำดับ",
    width: "7%",
    align: "center",
    render: (a,b,v) => <Typography.Text>{v+1}</Typography.Text>,
  },
  {
    title: "วันที่สั่งซื้อ",
    dataIndex: "stock_date",
    key: "stock_date",
    align: "left",    
    width: 170,
    hide: false,
    render: (v) => v ? dayjs(v).format("YYYY-MM-DD") : "",
  },
  {  title: "วันหมดอายุ",
    dataIndex: "expire_date",
    key: "expire_date",
    width: "30%",
    align: "left",
    render: (v) => v ? dayjs(v).format("YYYY-MM-DD") : "",
    type: 'date',
    width: 170,
    editable: true,
  },
  {
    title: "จำนวนสินค้า",
    dataIndex: "list_qty",
    key: "list_qty",
    align: "right",
    className: "!pe-3",
    type: 'number',
  },
  {
    title: "ตัวเลือก",
    align: "center",
    key: "operation",
    dataIndex: "operation",
    render: (_, record, idx) => handleAction(record),
    width: '80px',
    fixed: 'right',
  },
]; 

export const columnsParametersEditable = (handleSave,{handleAction}) => {
  const col = accessColumn({handleAction});
  return col.map((col, ind) => {
    if (!col.editable) return col;


    return {
      ...col,
      onCell: (record) => {
        // console.log(record);
        let prop = {};
        if (col?.type === 'number' && col.dataIndex === 'qty')
          prop = { max: Number((record?.qty) || 0) };
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          // required: !!col?.required,
          type: col?.type || "input",
          handleSave,
          childProps: prop,
        }
      },
    };
  });
}