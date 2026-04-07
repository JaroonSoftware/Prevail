import dayjs from "dayjs";
import { formatMoney } from "../../../utils/util";

export const createPurchaseReportPrintColumns = ({
  quantityTitle,
  quantityDataIndex,
}) => [
  {
    title: "ลำดับ",
    dataIndex: "__rowNo",
    key: "__rowNo",
    width: 55,
    align: "center",
    render: (value, record) => (record?._empty ? "" : value),
  },
  {
    title: "เลขที่ SO",
    dataIndex: "socode",
    key: "socode",
    width: 110,
    align: "center",
    render: (value, record) => (record?._empty ? "" : value || "-"),
  },
  {
    title: "วันที่สั่งขาย",
    dataIndex: "sodate",
    key: "sodate",
    width: 100,
    align: "center",
    render: (value, record) => {
      if (record?._empty) return "";
      return value ? dayjs(value).format("DD/MM/YYYY") : "-";
    },
  },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: 95,
    align: "center",
    render: (value, record) => (record?._empty ? "" : value || "-"),
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: 95,
    align: "center",
    render: (value, record) => (record?._empty ? "" : value || "-"),
  },
  {
    title: "ชื่อสินค้า",
    dataIndex: "stname",
    key: "stname",
    width: 240,
    render: (value, record) => (record?._empty ? "" : value || "-"),
  },
  {
    title: quantityTitle,
    dataIndex: quantityDataIndex,
    key: quantityDataIndex,
    width: 105,
    align: "right",
    render: (value, record) =>
      record?._empty ? "" : formatMoney(Number(value || 0), 2, 2),
  },
  {
    title: "หน่วย",
    dataIndex: "unit",
    key: "unit",
    width: 80,
    align: "center",
    render: (value, record) => (record?._empty ? "" : value || "-"),
  },
];