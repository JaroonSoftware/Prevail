import {
  FileTextFilled,
  ReconciliationFilled,
  AppstoreAddOutlined,
  BarcodeOutlined,
  BarChartOutlined,
  FundProjectionScreenOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { TbReportMoney } from "react-icons/tb";
import { RiTeamFill } from "react-icons/ri";
import { MdRamenDining } from "react-icons/md";
import { TiThLarge } from "react-icons/ti";
import { GiDatabase,GiFruitBowl,GiGrain } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { RiBox3Fill } from "react-icons/ri";
import { TfiTruck } from "react-icons/tfi";
import { BsShop } from "react-icons/bs";
let _nav = [
  {
    title: "SELL",
    type: "group",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ใบเสนอราคา",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/quotation",    
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ใบขายสินค้า",
    icon: <ReconciliationFilled className="nav-ico" />,    
    to: "/sales-order",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ปริ้นหน้าถุง",
    icon: <BarcodeOutlined  className="nav-ico" />, 
    to: "/print-weight",    
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ใบส่งของ",
    icon: <TfiTruck className="nav-ico" />,
    to: "/delivery-note",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ใบวางบิล",
    icon: <ReconciliationFilled className="nav-ico" />,
    to: "/billing",    
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ใบเสร็จรับเงิน",
    icon: <TbReportMoney className="nav-ico" />,
    to: "/receipt",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ข้อมูลลูกค้า",
    icon: <RiTeamFill className="nav-ico" />,
    to: "/customers",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "แคตตาล็อก",
    icon: <AppstoreAddOutlined className="nav-ico" />,
    to: "/catalog",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
   {
    title: "Reports",
    type: "group",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานขายแยกตามสินค้า",
    icon: <BarChartOutlined className="nav-ico" />,
    to: "/so-by-product-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานกำไรรายสินค้า แบ่งตามลูกค้า",
    icon: <FundProjectionScreenOutlined className="nav-ico" />,
    to: "/profit-by-product-customer-report",
    usernames: ["Nextrntt", "Nvdfti", "test"],
  },
  {
    title: "รายงานยอดขายแยกตามสินค้าขายดี",
    icon: <TrophyOutlined className="nav-ico" />,
    to: "/best-selling-product-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานยอดขายตามลูกค้า",
    icon: <TeamOutlined className="nav-ico" />,
    to: "/so-by-customer-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานการซื้อของแห้ง",
    icon: <GiGrain  className="nav-ico" />,
    to: "/dry-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานเส้น เต้าหู้",
    icon: <MdRamenDining  className="nav-ico" />,
    to: "/noodle-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานของแห้งพิเศษ",
    icon: <GiGrain className="nav-ico" />,
    to: "/special-dry-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานเครื่องแกง",
    icon: <MdRamenDining className="nav-ico" />,
    to: "/curry-paste-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานผลไม้",
    icon: <GiFruitBowl className="nav-ico" />,
    to: "/fruit-report",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "BUY",
    type: "group",
    hiddenRoles: ["พนักงานขาย","พนักงานส่งสินค้า"],
  },
  {
    title: "ใบสั่งซื้อ",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/purchase-order",
    hiddenRoles: ["พนักงานขาย","พนักงานส่งสินค้า"],
  },
  // {
  //   title: "ใบรับสินค้า",
  //   icon: <FileDoneOutlined className="nav-ico"/>, 
  //   to: "/goods-receipt",
  // },  
  {
    title: "ข้อมูลผู้ขาย",
    icon: <BsShop className="nav-ico" />,
    to: "/supplier",
    hiddenRoles: ["พนักงานขาย","พนักงานส่งสินค้า"],
  },
  {
    title: "MASTER",
    type: "group",
  },
  {
    title: "ข้อมูลสินค้า",
    icon: <GiDatabase className="nav-ico" />,
    to: "/items",
    hiddenRoles: ["พนักงานส่งสินค้า"],
  },
  {
    title: "ประเภทสินค้า",
    icon: <TiThLarge className="nav-ico" />,
    to: "/itemtype",
    hiddenRoles: ["พนักงานส่งสินค้า"],
  },
  {
    title: "หน่วยสินค้า",
    icon: <RiBox3Fill className="nav-ico" />,
    to: "/unit",
    hiddenRoles: ["พนักงานส่งสินค้า"],
  },
  {
    title: "เขตขนส่ง",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/county",    
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ผู้ใช้งาน",
    icon: <FaUserCircle className="nav-ico" />,
    to: "/users",
    hiddenRoles: ["จัดซื้อ","พนักงานขาย","พนักงานส่งสินค้า"],
  },
  
  {
    title: "แสกนส่งออกสินค้า",
    icon: <TfiTruck className="nav-ico" />,
    to: "/shipping",
    hiddenRoles: ["จัดซื้อ","พนักงานขาย"],
  },
 
];

export default _nav;
