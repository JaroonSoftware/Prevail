import dayjs from "dayjs";
import "dayjs/locale/th";
export const formatDryQuantity = value => Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
export function groupDryGoods(rows = []) {
  const groups = new Map();
  rows.forEach((row, index) => {
    const price = row.purchase_price == null || row.purchase_price === "" ? null : Number(row.purchase_price);
    const key = JSON.stringify([row.stcode || row.stname || "", price]);
    if (!groups.has(key)) groups.set(key, { key, name: row.stname || row.stcode || "–", price, customers: [], totals: new Map() });
    const group = groups.get(key);
    const qty = Number(row.qty_result || 0);
    const unit = String(row.unit || "").trim().toUpperCase();
    if (!Number.isFinite(qty)) return;
    // Preserve separate source lines (including repeated customers), as in the worksheet.
    group.customers.push({ key: index, code: row.cuscode || "–", name: row.cusname || "", qty, unit });
    group.totals.set(unit, (group.totals.get(unit) || 0) + qty);
  });
  return [...groups.values()];
}
export function dryDateLabel(rows, range) {
  let dates = Array.isArray(range) ? range.filter(Boolean).map(v => dayjs(v)) : [];
  if (!dates.length) dates = rows.map(r => dayjs(r.sodate)).filter(d => d.isValid()).sort((a,b) => a.valueOf()-b.valueOf());
  dates = dates.filter(d => d.isValid());
  if (!dates.length) return "ทุกวันที่";
  const first = dates[0], last = dates[dates.length - 1];
  const label = d => d.locale("th").format("D MMMM ") + (d.year() + 543);
  return first.isSame(last,"day") ? label(first) : label(first) + " – " + label(last);
}
