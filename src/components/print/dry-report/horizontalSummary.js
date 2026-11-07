import dayjs from "dayjs";
import "dayjs/locale/th";
export const formatDryQuantity = value => Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
export function groupDryGoods(rows = []) {
  const groups = new Map();
  rows.forEach((row, index) => {
    const rawPrice = row.sale_price;
    const numericPrice = rawPrice == null || String(rawPrice).trim() === "" ? NaN : Number(rawPrice);
    const price = Number.isFinite(numericPrice) ? numericPrice : null;
    const key = JSON.stringify([row.stcode || row.stname || ""]);
    if (!groups.has(key)) groups.set(key, { key, name: row.stname || row.stcode || "–", price, customers: [], customerMap: new Map(), totals: new Map() });
    const group = groups.get(key);
    // Minimum actual SO line price among the rows returned for the selected filters.
    if (price !== null && (group.price === null || price < group.price)) group.price = price;
    const qty = Number(row.qty_result || 0);
    const unit = String(row.unit || "").trim().toUpperCase();
    if (!Number.isFinite(qty)) return;
    const customerCode = String(row.cuscode || "").trim();
    // Missing codes must not combine unrelated customers.
    const customerKey = customerCode || "missing:" + index;
    if (!group.customerMap.has(customerKey)) {
      const customer = { key: customerKey, code: customerCode || "–", name: row.cusname || "", totals: new Map() };
      group.customerMap.set(customerKey, customer);
      group.customers.push(customer);
    }
    const customer = group.customerMap.get(customerKey);
    customer.totals.set(unit, (customer.totals.get(unit) || 0) + qty);
    group.totals.set(unit, (group.totals.get(unit) || 0) + qty);
  });
  return [...groups.values()];
}
export function dryDateLabel(rows, range) {
  let dates = Array.isArray(range) ? range.filter(Boolean).map(v => dayjs(v)) : [];
  if (!dates.length) dates = rows.filter(r => r.sodate).map(r => dayjs(r.sodate)).filter(d => d.isValid()).sort((a,b) => a.valueOf()-b.valueOf());
  dates = dates.filter(d => d.isValid());
  if (!dates.length) return "ทุกวันที่";
  const first = dates[0], last = dates[dates.length - 1];
  const label = d => d.locale("th").format("D MMMM ") + (d.year() + 543);
  return first.isSame(last,"day") ? label(first) : label(first) + " – " + label(last);
}
