import { Tag, Typography } from "antd";
import dayjs from "dayjs";
import { IoMdTime } from "react-icons/io";
import { formatMoney } from "../../../utils/util";

export const columns = ({ handleCheck, handleSelectChange }) => [
  {
    title: "ลำดับ",
    dataIndex: "ind",
    key: "ind",
    width: 60,
    render: (im, rc, index) => <>{index + 1}</>,
  },
  {
    title: "ใบขายสินค้า",
    dataIndex: "socode",
    key: "socode",
    width: 90,
    align: "right",
    className: "!pe-3",
  },
  {
      title: "วันที่สั่งขาย",
      dataIndex: "sodate",
      key: "sodate",
      align: "center",
      width: 100,
      render: (_, rec) => (
        <div className="flex items-center gap-1">
          {/* <IoMdTime /> */}
          <Typography.Text>
            {dayjs(rec.sodate).format("DD/MM/YYYY")}
          </Typography.Text>
        </div>
      ),
    },
  {
    title: "รหัสสินค้า",
    dataIndex: "stcode",
    key: "stcode",
    width: 90,
    align: "left",
  },
  {
    title: "รหัสลูกค้า",
    dataIndex: "cuscode",
    key: "cuscode",
    width: 90,
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
    title: "จำนวนที่สั่ง",
    dataIndex: "qty",
    key: "qty",
    width: 90,
    align: "right",
    className: "!pe-3",
    type: "number",
    render: (_, rec) => <>{formatMoney(Number(rec?.qty || 0), 2, 2)}</>,
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
  // {
  //   title: "ตัวเลือก",
  //   align: "center",
  //   key: "operation",
  //   dataIndex: "operation",
  //   render: (_, record, idx) => handleCheck(record),
  //   width: "90px",
  //   fixed: "right",
  // },
];