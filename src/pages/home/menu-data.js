import nav from '../../nav';
export const MODULES = [
 {code:'SO',title:'ขาย',english:'Sales',paths:['/quotation','/sales-order','/customers','/catalog','/so-by-product-report','/profit-by-product-customer-report','/best-selling-product-report','/so-by-customer-report','/sales-history-customer-report']},
 {code:'PU',title:'จัดซื้อ',english:'Purchasing',paths:['/purchase-order','/supplier']},
 {code:'IC',title:'สินค้า',english:'Inventory',paths:['/items','/itemtype','/unit','/print-weight','/dry-report','/noodle-report','/fresh-report','/special-dry-report','/curry-paste-report','/fruit-report']},
 {code:'AC',title:'บัญชี',english:'Accounting',paths:['/billing','/receipt','/delivery-note','/outstanding-by-customer-report']},
 {code:'SH',title:'จัดส่ง',english:'Shipping',paths:['/shipping','/delivery-trip','/county']},
 {code:'AD',title:'ผู้ดูแลระบบ',english:'Administration',paths:['/dashboard','/users','/permissions']},
];
export function visibleMenus(role, username) {
 return nav.filter(item=>{
  if(item.type || !item.to || item.to==='/menu') return false;
  if(item.usernames?.includes(username)) return true;
  return (!item.role || item.role.includes(role)) && !item.usernames && !item.hiddenRoles?.map(r=>r.toLowerCase()).includes(role);
 });
}
export const moduleForPath = path => MODULES.find(m=>m.paths.some(p=>path===p || path.startsWith(p+'/')));
export function readRecent(userId) {
 try {const rows=JSON.parse(localStorage.getItem('prevail-menu-recent:'+userId)||'[]');return Array.isArray(rows)?rows.filter(p=>typeof p==='string').slice(0,5):[];}catch{return [];}
}
export function recordRecent(userId,path) {const next=[path,...readRecent(userId).filter(p=>p!==path)].slice(0,5);try{localStorage.setItem('prevail-menu-recent:'+userId,JSON.stringify(next));}catch{}return next;}

// Sections within a module; use only menus already visible to this user.
const MASTER_PATHS = new Set(['/customers', '/catalog', '/supplier', '/items', '/itemtype', '/unit', '/county', '/users']);
export function moduleMenuSections(module, menus) {
 const sections = { system: [], master: [], report: [] };
 if (!module) return sections;
 menus.filter(menu => module.paths.includes(menu.to)).forEach(menu => {
   const section = menu.to.includes('report') ? 'report' : MASTER_PATHS.has(menu.to) ? 'master' : 'system';
   sections[section].push(menu);
 });
 return sections;
}
