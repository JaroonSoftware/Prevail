export const PERMISSION_MENUS = [
{
  "key": "sales-history-customer-report",
  "path": "/sales-history-customer-report",
  "title": "ประวัติการขายแยกตามลูกค้า",
  "group": "Reports",
  "actions": [
    "view"
  ],
  "hiddenRoles": [
    "จัดซื้อ",
    "พนักงานส่งสินค้า"
  ],
  "restricted": false,
  "admin_only": false
},
  {
    "key": "dashboard",
    "path": "/dashboard",
    "title": "Dashboard",
    "group": "DATA",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "quotation",
    "path": "/quotation",
    "title": "ใบเสนอราคา",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "sales-order",
    "path": "/sales-order",
    "title": "ใบขายสินค้า",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "print-weight",
    "path": "/print-weight",
    "title": "ปริ้นหน้าถุง",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "delivery-note",
    "path": "/delivery-note",
    "title": "ใบส่งของ",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "billing",
    "path": "/billing",
    "title": "ใบวางบิล",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "receipt",
    "path": "/receipt",
    "title": "ใบเสร็จรับเงิน",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "customers",
    "path": "/customers",
    "title": "ข้อมูลลูกค้า",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "catalog",
    "path": "/catalog",
    "title": "แคตตาล็อก",
    "group": "SELL",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "so-by-product-report",
    "path": "/so-by-product-report",
    "title": "รายงานขายแยกตามสินค้า",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "profit-by-product-customer-report",
    "path": "/profit-by-product-customer-report",
    "title": "รายงานกำไรรายสินค้า แบ่งตามลูกค้า",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [],
    "restricted": true,
    "admin_only": false
  },
  {
    "key": "best-selling-product-report",
    "path": "/best-selling-product-report",
    "title": "รายงานยอดขายแยกตามสินค้าขายดี",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "so-by-customer-report",
    "path": "/so-by-customer-report",
    "title": "รายงานยอดขายตามลูกค้า",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "dry-report",
    "path": "/dry-report",
    "title": "รายงานการซื้อของแห้ง",
    "group": "Reports",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "noodle-report",
    "path": "/noodle-report",
    "title": "รายงานเส้น เต้าหู้",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "fresh-report",
    "path": "/fresh-report",
    "title": "รายงานของสด",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "special-dry-report",
    "path": "/special-dry-report",
    "title": "รายงานของแห้งพิเศษ",
    "group": "Reports",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "curry-paste-report",
    "path": "/curry-paste-report",
    "title": "รายงานเครื่องแกง",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "fruit-report",
    "path": "/fruit-report",
    "title": "รายงานผลไม้",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "outstanding-by-customer-report",
    "path": "/outstanding-by-customer-report",
    "title": "รายงานค้างจ่ายตามลูกค้า",
    "group": "Reports",
    "actions": [
      "view"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "purchase-order",
    "path": "/purchase-order",
    "title": "ใบสั่งซื้อ",
    "group": "BUY",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "พนักงานขาย",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "ai-purchase-order",
    "path": "/ai-purchase-order",
    "title": "ใบสั่งซื้ออ่านค่าจาก AI (ทดสอบ)",
    "group": "BUY",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "พนักงานขาย",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "supplier",
    "path": "/supplier",
    "title": "ข้อมูลผู้ขาย",
    "group": "BUY",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "พนักงานขาย",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "items",
    "path": "/items",
    "title": "ข้อมูลสินค้า",
    "group": "MASTER",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "itemtype",
    "path": "/itemtype",
    "title": "ประเภทสินค้า",
    "group": "MASTER",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "unit",
    "path": "/unit",
    "title": "หน่วยสินค้า",
    "group": "MASTER",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "county",
    "path": "/county",
    "title": "เขตขนส่ง",
    "group": "MASTER",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานส่งสินค้า"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "users",
    "path": "/users",
    "title": "ผู้ใช้งาน",
    "group": "MASTER",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานขาย",
      "พนักงานส่งสินค้า"
    ],
    "restricted": true,
    "admin_only": true
  },
  {
    "key": "shipping",
    "path": "/shipping",
    "title": "แสกนส่งออกสินค้า",
    "group": "MASTER",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": [
      "จัดซื้อ",
      "พนักงานขาย"
    ],
    "restricted": false,
    "admin_only": false
  },
  {
    "key": "goods-receipt",
    "title": "รับสินค้า",
    "group": "BUY",
    "path": "/goods-receipt",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": []
  },
  {
    "key": "files-control",
    "title": "เอกสารแนบ",
    "group": "MASTER",
    "path": "/files-control",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": []
  },
  {
    "key": "permission",
    "title": "สิทธิ์การเข้าถึงโปรแกรม",
    "group": "MASTER",
    "admin_only": true,
    "path": "/permission",
    "actions": [
      "view",
      "add",
      "edit",
      "delete"
    ],
    "hiddenRoles": []
  }
];
export const ACTION_LABEL = {view:'ดู',add:'เพิ่ม',edit:'แก้ไข',delete:'ลบ/ยกเลิก'};
const aliases = {"permissions":"permission","so-print":"sales-order","dn-print":"delivery-note","bl-print":"billing","re-print":"receipt","quo-print":"quotation","catalog-print":"catalog","sales-by-product-print":"so-by-product-report","sales-by-customer-print":"so-by-customer-report","profit-by-product-customer-print":"profit-by-product-customer-report","best-selling-product-print":"best-selling-product-report","outstanding-by-customer-print":"outstanding-by-customer-report","so-by-product-report-print":"so-by-product-report","profit-by-product-customer-report-print":"profit-by-product-customer-report","best-selling-product-report-print":"best-selling-product-report","so-by-customer-report-print":"so-by-customer-report","dry-report-print":"dry-report","noodle-report-print":"noodle-report","fresh-report-print":"fresh-report","special-dry-report-print":"special-dry-report","curry-paste-report-print":"curry-paste-report","fruit-report-print":"fruit-report","outstanding-by-customer-report-print":"outstanding-by-customer-report"};
export function menuForPath(pathname) { const part = pathname.split('/').filter(Boolean)[0] || ''; return aliases[part] || (PERMISSION_MENUS.some(m=>m.key===part) ? part : null); }
export function actionForPath(pathname) { if (/\/manage\/create(?:\/|$)|\/ai-import(?:\/|$)/.test(pathname) || pathname === '/ai-purchase-order') return 'add'; if (/\/manage\/edit(?:\/|$)|\/order$/.test(pathname)) return 'edit'; return 'view'; }
