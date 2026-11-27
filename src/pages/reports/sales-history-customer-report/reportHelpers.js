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
  const units = new Map(); let subtotal = 0, net = 0, discount = 0;
  rows.forEach(row => {
    units.set(row.unit || '-', (units.get(row.unit || '-') || 0) + numeric(row.qty));
    subtotal += cents(row.line_subtotal); net += cents(row.line_net_total); discount += cents(row.line_discount);
  });
  return { units: [...units].map(([unit, qty]) => ({ unit, qty })), subtotal: subtotal / 100, net: net / 100, discount: discount / 100 };
}

export const REPORT_TITLES = { customer: REPORT_TITLE, product: 'รายงานขาย แยกตามสินค้า' };

/* mode = 'customer' : ลูกค้า > สินค้า > รายการ   (รายงานประวัติการขาย แยกตามลูกค้า)
   mode = 'product'  : สินค้า > ลูกค้า > รายการ   (รายงานขาย แยกตามสินค้า)
   หัวกลุ่มชั้นนอกใช้ type 'customer' ชั้นในใช้ 'product' (แค่ชื่อ type สำหรับจัดหน้า/สไตล์) */
export function buildHistoryRows(raw = [], mode = 'customer') {
  const byProduct = mode === 'product';
  const custKey = row => String(row.cuscode || '');
  const prodKey = row => JSON.stringify([row.stcode, row.unit || '-']);
  const custText = g => g.name + ' / ' + g.code;
  const prodText = g => (g.name || g.code) + (g.english ? ' (' + g.english + ')' : '') + ' / ' + g.code + (byProduct ? '  · หน่วย ' + g.unit : '');
  const custGroup = row => ({ code: custKey(row), name: row.cusname || custKey(row), unit: '', rows: [], subs: new Map() });
  const prodGroup = row => ({ code: row.stcode, name: row.stname, english: row.stnameEN, unit: row.unit || '-', rows: [], subs: new Map() });
  const outer = { key: byProduct ? prodKey : custKey, make: byProduct ? prodGroup : custGroup, text: byProduct ? prodText : custText };
  /* แยกตามสินค้า: ไม่มีหัวกลุ่มลูกค้า รายการอยู่ใต้สินค้าเลย (รหัสลูกค้าอยู่ในแถว) */
  const inner = byProduct
    ? { key: () => 'all', make: () => ({ code: '', unit: '', rows: [], subs: new Map() }), text: () => '' }
    : { key: prodKey, make: prodGroup, text: prodText };

  const groups = new Map();
  raw.forEach((source, index) => {
    const row = { ...source, qty: numeric(source.qty), price: numeric(source.price),
      line_subtotal: numeric(source.line_subtotal ?? numeric(source.qty) * numeric(source.price)),
      line_net_total: numeric(source.line_net_total ?? numeric(source.qty) * numeric(source.price) * (1 + numeric(source.vat) / 100)),
      line_discount: numeric(source.line_discount), index };
    const ok = outer.key(row);
    if (!groups.has(ok)) groups.set(ok, outer.make(row));
    const g = groups.get(ok);
    g.rows.push(row);
    const ik = inner.key(row);
    if (!g.subs.has(ik)) g.subs.set(ik, inner.make(row));
    g.subs.get(ik).rows.push(row);
  });
  const byCode = (a, b) => String(a.code).localeCompare(String(b.code), 'th') || String(a.unit).localeCompare(String(b.unit));
  const output = [];
  [...groups.values()].sort(byCode).forEach(g => {
    const customerHeading = { type: 'customer', text: outer.text(g) };
    output.push(customerHeading);
    [...g.subs.values()].sort(byCode).forEach(sub => {
      const productHeading = byProduct ? null : { type: 'product', text: inner.text(sub), customerHeading };
      if (productHeading) output.push(productHeading);
      sub.rows.sort((a,b) => (byProduct ? String(a.dndate).localeCompare(String(b.dndate)) || String(a.cuscode).localeCompare(String(b.cuscode)) : 0) || String(a.dndate).localeCompare(String(b.dndate)) || String(a.dncode).localeCompare(String(b.dncode)) || numeric(a.detail_code)-numeric(b.detail_code) || a.index-b.index);
      sub.rows.forEach(row => output.push({ type: 'detail', row, customerHeading, productHeading }));
      output.push({ type: 'productTotal', label: byProduct ? 'รวมตาม ใบกำกับ' : 'รวมตามสินค้า', totals: totals(sub.rows), customerHeading, productHeading });
    });
    output.push({ type: 'customerTotal', label: 'รวม ' + g.code, totals: totals(g.rows), customerHeading });
  });
  if (raw.length) {
    output.push({ type: 'grandTotal', label: 'รวมทั้งสิ้น', totals: totals(raw.map(r => ({ ...r,
      line_subtotal: r.line_subtotal ?? numeric(r.qty)*numeric(r.price),
      line_net_total: r.line_net_total ?? numeric(r.qty)*numeric(r.price)*(1+numeric(r.vat)/100) }))) });
    output.push({ type: 'note', text: mode === 'product' ? 'หมายเหตุ: ส่วนลด = ส่วนลด % จากใบขาย (คิดก่อน VAT) · ยอดขายสุทธิหักส่วนลดแล้ว · VAT ใช้อัตราสินค้าปัจจุบัน' : 'หมายเหตุ: – หมายถึงไม่มีข้อมูลคืนสินค้า/ส่วนลด · ส่วนลด = ส่วนลด % จากใบขาย (คิดก่อน VAT) · ยอดขายสุทธิหักส่วนลดแล้ว' });
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
  /* ไม่หยุดทั้งรายงานเพราะบรรทัดเดียว: บรรทัดที่วัดความสูงไม่ได้ ใช้ค่าประมาณ
     บรรทัดที่ยาวเกินหน้า (เช่น หมายเหตุยาวมาก) ให้ขึ้นหน้าใหม่ แล้วตัดส่วนที่เกินหน้า */
  const maxRow = Math.max(24, capacity * 0.85);
  heights = rows.map((_, i) => {
    const h = heights[i];
    if (!Number.isFinite(h) || h <= 0) return 18;
    return Math.min(h, maxRow);
  });
  for (let i=0;i<rows.length;i++) {
    const row = rows[i], height = heights[i];
    let required = height;
    // Keep customer/product headings with their first detail; keep a final detail with its subtotal.
    if (row.type === 'customer' || row.type === 'product') {
      for(let j=i+1;j<rows.length;j++) { required += heights[j]; if(!['customer','product'].includes(rows[j].type)) break; }
    } else if(row.type==='detail' && rows[i+1]?.type==='productTotal') required += heights[i+1];
    if (page.length && used + Math.min(required,capacity) > capacity) { pages.push(page); page=[];used=0; }
    if (!page.length) {
      const repeats=repeatsFor(row);
      const extra=repeats.reduce((n,r)=>n+repeatHeight(r),0);
      page.push(...repeats); used=extra;
    }
    page.push(row);used+=height;
  }
  if(page.length)pages.push(page);
  return pages;
}
