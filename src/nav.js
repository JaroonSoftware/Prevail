import { FileTextFilled, ReconciliationFilled,FileDoneOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import { TbReportMoney } from "react-icons/tb";
import { RiTeamFill } from "react-icons/ri";
import { MdOutlineDashboard } from "react-icons/md";
import { TiThLarge } from "react-icons/ti";
import { GiDatabase } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { RiBox3Fill } from "react-icons/ri";
import { BsShop } from "react-icons/bs";
let _nav = [
  {
    title: "MENU",
    type: "group",
  },
  {
    title: "หน้าหลัก",
    icon: <MdOutlineDashboard className="nav-ico" />,
    to: "/dashboard",
  },
  {
    title: "SELL",
    type: "group",
  },  
  {
    title: "ข้อมูลลูกค้า",
    icon: <RiTeamFill className="nav-ico" />,
    to: "/customers",
  },
  {
    title: "BUY",
    type: "group",
  },
  {
    title: "ใบสั่งซื้อ",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/purchase-order",
  },
  {
    title: "ใบรับสินค้า",
    icon: <FileDoneOutlined className="nav-ico"/>, 
    to: "/goods-receipt",
  },  
  {
    title: "ข้อมูลผู้ขาย",
    icon: <BsShop className="nav-ico" />,
    to: "/supplier",
  },
  {
    title: "MASTER",
    type: "group",
  },
  {
    title: "ข้อมูลสินค้า",
    icon: <GiDatabase className="nav-ico" />,
    to: "/items",
  },
  {
    title: "แคตตาล็อก",
    icon: <AppstoreAddOutlined className="nav-ico" />,
    to: "/catalog",
  },
  {
    title: "ประเภทสินค้า",
    icon: <TiThLarge className="nav-ico" />,
    to: "/itemtype",
  },
  {
    title: "หน่วยสินค้า",
    icon: <RiBox3Fill className="nav-ico" />,
    to: "/unit",
  },
  {
    title: "ผู้ใช้งาน",
    icon: <FaUserCircle className="nav-ico" />,
    to: "/users",
  },

  {
    title: "กำลังปรับปรุง",
    type: "group",
  },
  {
    title: "ใบเสนอราคา",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/quotation",    
  },
  {
    title: "ใบวางบิล",
    icon: <ReconciliationFilled className="nav-ico" />,
    to: "/iv",    
  },
  {
    title: "ใบเสร็จรับเงิน",
    icon: <TbReportMoney className="nav-ico" />,
    to: "/r",
    // to: "/receipt",
  },
  {
    title: "ใบขายสินค้า",
    icon: <ReconciliationFilled className="nav-ico" />,
    to: "/so",
  },
];

export default _nav;
