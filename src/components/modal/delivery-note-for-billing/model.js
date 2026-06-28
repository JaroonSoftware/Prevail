/** get items column */
import { TagSalesOrderStatus, TagDeliveryNoteStatus } from "../../badge-and-tag";
import dayjs from "dayjs";
import { formatMoney } from "../../../utils/util";
export const columns = ()=>{
  return [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      hidden: "true",
    },
    {
      title: "เลขที่ใบขายสินค้า",
      key: "socode",
      width: "15%",
      dataIndex: "socode",         
    },
    {
      title: "วันที่ใบขายสินค้า",
      key: "sodate",
      width: "15%",
      dataIndex: "sodate", 
    },
    {
      title: "PO ลูกค้า",
      key: "customer_po",
      width: "15%",
      dataIndex: "customer_po", 
    },
    {
      title: "รหัสลูกค้า",
      key: "cuscode",
      width: "15%",
      dataIndex: "cuscode", 
    },
    {
      title: "ชื่อลูกค้า",
      dataIndex: "cusname",
      width: "35%",
      key: "cusname",
    },
    {
      title: "สถานะ",
      dataIndex: "doc_status",
      key: "doc_status", 
      width: '20%',
      align: "center",
      render: (data) => <TagSalesOrderStatus result={data} />,
    },
  ]
};

export const dnSummaryColumns = () => {
  return [
    {
      title: "เลขที่ใบส่งของ",
      key: "dncode",
      width: "20%",
      dataIndex: "dncode",
    },
    {
      title: "วันที่ใบส่งของ",
      key: "dndate",
      width: "20%",
      dataIndex: "dndate",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "ชื่อลูกค้า",
      dataIndex: "cusname",
      width: "30%",
      key: "cusname",
    },
    {
      title: "สถานะ",
      dataIndex: "doc_status",
      key: "doc_status",
      width: "15%",
      align: "center",
      render: (data) => <TagDeliveryNoteStatus result={data} />,
    },
    {
      title: "ยอดรวม",
      dataIndex: "total_price",
      key: "total_price",
      width: "15%",
      align: "right",
      render: (v) => formatMoney(Number(v || 0), 2),
    },
  ];
};

export const shippingColumns = () => {
  return [
    {
      title: "เลขที่ใบส่งของ",
      key: "dncode",
      width: "14%",
      dataIndex: "dncode",
    },
    {
      title: "เลขที่ใบขายสินค้า",
      key: "socode",
      width: "14%",
      dataIndex: "socode",
    },
    {
      title: "รหัสสินค้า",
      key: "stcode",
      width: "14%",
      dataIndex: "stcode",
    },
    {
      title: "ชื่อสินค้า",
      dataIndex: "stname",
      width: "30%",
      key: "stname",
    },
    {
      title: "จำนวน",
      dataIndex: "qty",
      width: "10%",
      key: "qty",
      align: "right",
    },
    {
      title: "หน่วย",
      dataIndex: "unit",
      width: "8%",
      key: "unit",
      align: "center",
    },
    {
      title: "ราคาขาย",
      dataIndex: "price",
      width: "10%",
      key: "price",
      align: "right",
    },
  ];
};