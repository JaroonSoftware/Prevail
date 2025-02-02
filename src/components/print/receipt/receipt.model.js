// import { Typography } from "antd";
// import { comma } from "../../../utils/util";
// import dayjs from 'dayjs';
export const column = [
 
  {
    title: (
      <div style={{ textAlign: "left"}}>
        ชำระค่า :
      </div>
    ),
    align: "left",
    width: "15%",
    key: "ivcode",
    dataIndex: "ivcode",
  },

  {
    title: (
      <div style={{ textAlign: "center" ,borderBottom: "1px solid" }}>
        เงินคงค้าง
      </div>
    ),
    align: "left",
    width: "10%",
    key: "",
    dataIndex: "",
    onCell: () => ({
      style: {
        borderRight: "1px solid ",
      },
    }),
  },
];
