import { Tag, Typography } from "antd";
import dayjs from "dayjs";
import { IoMdTime } from "react-icons/io";
import { TagDeliveryNoteStatus, TagSalesOrderStatus } from "../../components/badge-and-tag";
import { comma, formatMoney } from "../../utils/util";

export const salesOrderListColumn = ({handleShowDetail}) => [
    {
      title: "เลขที่ใบขายสินค้า",
      key: "socode",
      dataIndex: "socode",
      align: "left",
      render : (value, record) => <Typography.Link onClick={() => handleShowDetail(record)}>{value || "-"}</Typography.Link>
    },
    {
      title: "วันที่ใบขายสินค้า",
      key: "sodate",
      dataIndex: "sodate",
      render : (v) => v ? dayjs(v).format("DD/MM/YYYY") : "-"
    },
    {
      title: "ชื่อลูกค้า",
      key: "cusname",
      dataIndex: "cusname",
      align: "left",
    },
    {
      title: "สถานะเอกสาร",
      key: "doc_status",
      dataIndex: "doc_status",
      render : (value) => <TagSalesOrderStatus result={value} />
    },
    // {
    //   title: "สถานะปริ้น",
    //   key: "print_status",
    //   dataIndex: "print_status",
    //   render : (value) => <TagSalesOrderStatus result={value} />
    // },
    {
      title: "ระยะเวลา",
      key: "waiting_days",
      dataIndex: "sodate",
      render: (v) => {
        const parsedDate1 = dayjs(v);
        const parsedDate2 = dayjs(new Date());
        const diffInDays = parsedDate2.diff(parsedDate1, 'day');

        return diffInDays < 1 ? <Tag color="#3ab38a">วันนี้</Tag> : <Tag color="#b4b4b1">{diffInDays} วันที่แล้ว</Tag>;
      }
    },
]

export const deliveryNoteListColumn = [
    {
      title: "",
      key: "ind",
      dataIndex: "ind",
      width:20,
      render:() => <IoMdTime color="#ff7e23" style={{fontSize: '1.3rem'}} />
    },
    {
      title: "เลขที่ใบส่งของ",
      key: "dncode",
      dataIndex: "dncode",
      align: "left",
    },
    {
      title: "วันที่ใบส่งของ",
      key: "dndate",
      dataIndex: "dndate",
      render : (v) => v ? dayjs(v).format("DD/MM/YYYY") : "-"
    },
    {
      title: "ชื่อลูกค้า",
      key: "cusname",
      dataIndex: "cusname",
      align: "left",
    },
    {
      title: "สถานะเอกสาร",
      key: "doc_status",
      dataIndex: "doc_status",
      render: (value) => <TagDeliveryNoteStatus result={value} />
    },
    {
      title: "สถานะตัดสต๊อก",
      key: "issue_status",
      dataIndex: "issue_status",
      render: (value) => <TagDeliveryNoteStatus result={value} />
    },
    {
      title: "ระยะเวลา",
      key: "waiting_days",
      dataIndex: "dndate",
      render: (v) => {
        const parsedDate1 = dayjs(v);
        const parsedDate2 = dayjs(new Date());
        const diffInDays = parsedDate2.diff(parsedDate1, 'day');

        return diffInDays < 1 ? <Tag color="#3ab38a">วันนี้</Tag> : <Tag color="#b4b4b1">{diffInDays} วันที่แล้ว</Tag>;
      }
    },
]

export const itemFileExpireColumn = [
    {
      title: "Item Code",
      key: "itemcode",
      dataIndex: "itemcode", 
    },
    {
      title: "Item Name",
      key: "stname",
      dataIndex: "stname", 
      align: "left",  
    },
    {
      title: "Title Name",
      key: "title_name",
      dataIndex: "title_name", 
      align: "left",  
    },
    {
      title: "Exprie Date",
      key: "expire_date",
      dataIndex: "expire_date", 
      render : (v) => dayjs(v).format("DD/MM/YYYY")
    },
    {
      title: "Will expire on",
      key: "diff_days",
      dataIndex: "diff_days", 
      render: (v) => {     
        const inDay = Number( v );
        return  inDay > 0 
        ? <Tag color={ inDay <= 5 ? "#cd201f" : "#ebb539" } >Expires in {inDay} days.</Tag> 
        : <Tag color="#292626cc" >Expired.</Tag>;
      }
    },
];

export const salesOrderDetailColumn = [
    {
      title: "ชื่อสินค้า",
      key: "stname",
      dataIndex: "stname",
    },
    {
      title: "หน่วย",
      key: "unit",
      dataIndex: "unit",
      align: "left",
    },
    {
      title: "จำนวน",
      key: "qty",
      dataIndex: "qty",
      align: "right",
      render:(v) => comma( Number(v || 0), 2, 2 )
    },
    {
      title: "ราคาขาย",
      key: "price",
      dataIndex: "price",
      align: "right",
      render:(v) => formatMoney( Number(v || 0), 2 )
    },
    {
      title: "VAT (%)",
      key: "vat",
      dataIndex: "vat",
      align: "right",
      render:(v) => comma( Number(v || 0), 0 )
    },
    {
      title: "ราคารวมสุทธิ",
      key: "totalnet",
      dataIndex: "totalnet",
      align: "right",
      render:(_, record) => {
        const base = Number(record?.qty || 0) * Number(record?.price || 0);
        const net = base * (1 + Number(record?.vat || 0) / 100);

        return formatMoney(net, 2);
      }
    },
];


export const statisticValue = {
  daily : 0,
  monthly : 0,
  yearly : 0,
  waiting : 0,
}