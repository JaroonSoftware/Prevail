import dayjs from 'dayjs';

export const REPORT_TITLE = 'รายงานประวัติการขาย แยกตามลูกค้า';
export const COMPANY_NAME = 'บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด';
export const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const cents = value => Math.round((numeric(value) + Number.EPSILON) * 100);
export const money = value => numeric(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const quantity = value => numeric(value).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export function thaiDate(value) {
  const d = dayjs(value);
  return value && d.isValid() ? d.format('DD/MM/') + String(d.year() + 543).slice(-2) : '-';
}

// Totals accumulate integer satang; quantities remain separate for each unit.
function totals(rows) {
  const units = new Map(); let subtotal = 0, net = 0;
  rows.forEach(row => {
    units.set(row.unit || '-', (units.get(row.unit || '-') || 0) + numeric(row.qty));
    subtotal += cents(row.line_subtotal); net += cents(row.line_net_total);
  });
  return { units: [...units].map(([unit, qty]) => ({ unit, qty })), subtotal: subtotal / 100, net: net / 100 };
}

export function buildHistoryRows(raw = []) {
  const customers = new Map();
  raw.forEach((source, index) => {
    const row = { ...source, qty: numeric(source.qty), price: numeric(source.price),
      line_subtotal: numeric(source.line_subtotal ?? numeric(source.qty) * numeric(source.price)),
      line_net_total: numeric(source.line_net_total ?? numeric(source.qty) * numeric(source.price) * (1 + numeric(source.vat) / 100)), index };
    const customerKey = String(row.cuscode || '');
    if (!customers.has(customerKey)) customers.set(customerKey, { code: customerKey, name: row.cusname || customerKey, rows: [], products: new Map() });
    const customer = customers.get(customerKey);
    customer.rows.push(row);
    const productKey = JSON.stringify([row.stcode, row.unit || '-']);
    if (!customer.products.has(productKey)) customer.products.set(productKey, { code: row.stcode, name: row.stname, english: row.stnameEN, unit: row.unit || '-', rows: [] });
    customer.products.get(productKey).rows.push(row);
  });
  const output = [];
  [...customers.values()].sort((a,b) => a.code.localeCompare(b.code, 'th', {numeric:false})).forEach(customer => {
    const customerHeading = { type: 'customer', text: customer.name + ' / ' + customer.code };
    output.push(customerHeading);
    [...customer.products.values()].sort((a,b) => String(a.code).localeCompare(String(b.code), 'th') || a.unit.localeCompare(b.unit)).forEach(product => {
      const productHeading = { type: 'product', text: (product.name || product.code) + (product.english ? ' (' + product.english + ')' : '') + ' / ' + product.code, customerHeading };
      output.push(productHeading);
      product.rows.sort((a,b) => String(a.dndate).localeCompare(String(b.dndate)) || String(a.dncode).localeCompare(String(b.dncode)) || numeric(a.detail_code)-numeric(b.detail_code) || a.index-b.index);
      product.rows.forEach(row => output.push({ type: 'detail', row, customerHeading, productHeading }));
      output.push({ type: 'productTotal', label: 'รวมตามสินค้า', totals: totals(product.rows), customerHeading, productHeading });
    });
    output.push({ type: 'customerTotal', label: 'รวม ' + customer.code, totals: totals(customer.rows), customerHeading });
  });
  if (raw.length) {
    output.push({ type: 'grandTotal', label: 'รวมทั้งสิ้น', totals: totals(raw.map(r => ({ ...r,
      line_subtotal: r.line_subtotal ?? numeric(r.qty)*numeric(r.price),
      line_net_total: r.line_net_total ?? numeric(r.qty)*numeric(r.price)*(1+numeric(r.vat)/100) }))) });
    output.push({ type: 'note', text: 'หมายเหตุ: – หมายถึงไม่มีข้อมูลคืนสินค้า/ส่วนลด · VAT ใช้อัตราสินค้าปัจจุบันตามรายงานขายเดิม' });
    output.push({ type: 'end', text: '>>>> จบรายงาน <<<<' });
  }
  return output.map((row, index) => ({ ...row, id: index }));
}

// Paginate using actual browser-measured heights from the same report table.
export function paginateHistory(rows, heights, capacity, repeatHeight) {
  if (!rows.length) return [];
  const pages = []; let page = [], used = 0;
  const repeatsFor = row => {
    const result = [];
    if (row.type !== 'customer' && row.customerHeading) result.push({ ...row.customerHeading, continued: true });
    if (['detail','productTotal'].includes(row.type) && row.productHeading) result.push({ ...row.productHeading, continued: true });
    return result;
  };
  for (let i=0;i<rows.length;i++) {
    const row = rows[i], height = heights[i];
    if (!Number.isFinite(height) || height <= 0 || height > capacity) throw new Error('มีข้อความในรายงานยาวเกินหนึ่งหน้า กรุณาลดความยาวหมายเหตุ');
    let required = height;
    // Keep customer/product headings with their first detail; keep a final detail with its subtotal.
    if (row.type === 'customer' || row.type === 'product') {
      for(let j=i+1;j<rows.length;j++) { required += heights[j]; if(!['customer','product'].includes(rows[j].type)) break; }
    } else if(row.type==='detail' && rows[i+1]?.type==='productTotal') required += heights[i+1];
    if (page.length && used + Math.min(required,capacity) > capacity) { pages.push(page); page=[];used=0; }
    if (!page.length) {
      const repeats=repeatsFor(row);
      const extra=repeats.reduce((n,r)=>n+repeatHeight(r),0);
      if(extra+height>capacity) throw new Error('ข้อมูลหนึ่งรายการยาวเกินหน้ากระดาษ');
      page.push(...repeats); used=extra;
    }
    if(used+height>capacity) throw new Error('ไม่สามารถจัดหน้ารายงานได้ กรุณาลดความยาวข้อความ');
    page.push(row);used+=height;
  }
  if(page.length)pages.push(page);
  return pages;
}
