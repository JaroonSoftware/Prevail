import {
  FileTextFilled,
  ReconciliationFilled,
  AppstoreAddOutlined,
  BarcodeOutlined,
  BarChartOutlined,
  FundProjectionScreenOutlined,
  TrophyOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { TbReportMoney } from "react-icons/tb";
import { RiTeamFill } from "react-icons/ri";
import { MdRamenDining } from "react-icons/md";
import { TiThLarge } from "react-icons/ti";
import { GiDatabase,GiFruitBowl,GiGrain,GiMeat } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { RiBox3Fill } from "react-icons/ri";
import { TfiTruck } from "react-icons/tfi";
import { BsShop } from "react-icons/bs";
import { MdOutlineDashboard  } from "react-icons/md";

let _nav = [
  { title: "เมนูระบบ", icon: <AppstoreAddOutlined className="nav-ico" />, to: "/menu", english: "System Menu",},
  { title: "สิทธิ์การเข้าถึงโปรแกรม", icon: <TeamOutlined className="nav-ico" />, to: "/permissions", english: "Access Permissions", role: ["admin"] },
  {
      title: "DATA",
      type: "group",
    },
    {
      title: "Dashboard",
      icon: <MdOutlineDashboard className="nav-ico" />,
      to: "/dashboard", english: "Dashboard",
    },  
  {
    title: "SELL",
    type: "group",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ใบเสนอราคา",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/quotation",    english: "Quotation",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
    hidden: true, // ซ่อนเมนูใบเสนอราคา (หน้ายังเปิดผ่านลิงก์เอกสารได้) — ลบบรรทัดนี้เพื่อแสดงกลับ
  },  
  {
    title: "ใบขายสินค้า",
    icon: <ReconciliationFilled className="nav-ico" />,    
    to: "/sales-order", english: "Sales Order",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ปริ้นหน้าถุง",
    icon: <BarcodeOutlined  className="nav-ico" />, 
    to: "/print-weight",    english: "Bag Label Printing",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ใบส่งของ",
    icon: <TfiTruck className="nav-ico" />,
    to: "/delivery-note", english: "Delivery Note",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ใบวางบิล",
    icon: <ReconciliationFilled className="nav-ico" />,
    to: "/billing",    english: "Billing Note",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "นำเข้าใบขายข้อมูลเก่า",
    icon: <ReconciliationFilled className="nav-ico" />,
    to: "/legacy-import", english: "Legacy Sales Import",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ใบเสร็จรับเงิน",
    icon: <TbReportMoney className="nav-ico" />,
    to: "/receipt", english: "Receipt",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ข้อมูลลูกค้า",
    icon: <RiTeamFill className="nav-ico" />,
    to: "/customers", english: "Customers",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "แคตตาล็อก",
    icon: <AppstoreAddOutlined className="nav-ico" />,
    to: "/catalog", english: "Catalog",
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
    to: "/so-by-product-report", english: "Sales by Product",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานกำไรรายสินค้า แบ่งตามลูกค้า",
    icon: <FundProjectionScreenOutlined className="nav-ico" />,
    to: "/profit-by-product-customer-report", english: "Profit by Product & Customer",
    usernames: ["Nextrntt", "Nvdfti", "test"],
  },
  {
    title: "รายงานยอดขายแยกตามสินค้าขายดี",
    icon: <TrophyOutlined className="nav-ico" />,
    to: "/best-selling-product-report", english: "Best-Selling Products",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานยอดขายตามลูกค้า",
    icon: <TeamOutlined className="nav-ico" />,
    to: "/so-by-customer-report", english: "Sales by Customer",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "ประวัติการขายแยกตามลูกค้า",
    icon: <TeamOutlined className="nav-ico" />,
    to: "/sales-history-customer-report", english: "Sales History by Customer",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานการซื้อของแห้ง",
    icon: <GiGrain  className="nav-ico" />,
    to: "/dry-report", english: "Dry Goods Purchase",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานเส้น เต้าหู้",
    icon: <MdRamenDining  className="nav-ico" />,
    to: "/noodle-report", english: "Noodles & Tofu",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานของสด",
    icon: <GiMeat className="nav-ico" />,
    to: "/fresh-report", english: "Fresh Produce",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานของแห้งพิเศษ",
    icon: <GiGrain className="nav-ico" />,
    to: "/special-dry-report", english: "Special Dry Goods",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานเครื่องแกง",
    icon: <MdRamenDining className="nav-ico" />,
    to: "/curry-paste-report", english: "Curry Paste",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานผลไม้",
    icon: <GiFruitBowl className="nav-ico" />,
    to: "/fruit-report", english: "Fruit",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "รายงานค้างจ่ายตามลูกค้า",
    icon: <WalletOutlined className="nav-ico" />,
    to: "/outstanding-by-customer-report", english: "Outstanding by Customer",
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
    to: "/purchase-order", english: "Purchase Order",
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
    to: "/supplier", english: "Suppliers",
    hiddenRoles: ["พนักงานขาย","พนักงานส่งสินค้า"],
  },
  {
    title: "MASTER",
    type: "group",
  },
  {
    title: "ข้อมูลสินค้า",
    icon: <GiDatabase className="nav-ico" />,
    to: "/items", english: "Products",
    hiddenRoles: ["พนักงานส่งสินค้า"],
  },
  {
    title: "ประเภทสินค้า",
    icon: <TiThLarge className="nav-ico" />,
    to: "/itemtype", english: "Product Types",
    hiddenRoles: ["พนักงานส่งสินค้า"],
  },
  {
    title: "หน่วยสินค้า",
    icon: <RiBox3Fill className="nav-ico" />,
    to: "/unit", english: "Units",
    hiddenRoles: ["พนักงานส่งสินค้า"],
  },
  {
    title: "เที่ยวรถ",
    icon: <FileTextFilled className="nav-ico" />,
    to: "/delivery-trip", english: "Delivery Trips",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },
  {
    title: "เขตขนส่ง",
    icon: <FileTextFilled className="nav-ico" />, 
    to: "/county",    english: "Delivery Zones",
    hiddenRoles: ["จัดซื้อ","พนักงานส่งสินค้า"],
  },  
  {
    title: "ผู้ใช้งาน",
    icon: <FaUserCircle className="nav-ico" />,
    to: "/users", english: "Users",
    hiddenRoles: ["จัดซื้อ","พนักงานขาย","พนักงานส่งสินค้า"],
    usernames: ["Yui6003", "test"],
  },
  
  {
    title: "แสกนส่งออกสินค้า",
    icon: <TfiTruck className="nav-ico" />,
    to: "/shipping", english: "Shipping Scan",
    hiddenRoles: ["จัดซื้อ","พนักงานขาย"],
  },
 
];

export default _nav;
