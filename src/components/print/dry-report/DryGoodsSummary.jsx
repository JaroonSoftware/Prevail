import React from "react";
import { groupDryGoods, dryDateLabel, formatDryQuantity } from "./horizontalSummary";
import "./horizontal-summary.css";
const SLOTS = 4;
export default function DryGoodsSummary({ rows = [], dateRange }) {
  const groups = groupDryGoods(rows);
  return <div className="dry-horizontal-scroll"><table className="dry-horizontal-table">
    <colgroup><col style={{width:"33%"}}/><col style={{width:"11%"}}/>{Array.from({length:SLOTS}, (_,i) => <col key={i} style={{width:"10%"}}/>)}<col style={{width:"16%"}}/></colgroup>
    <thead><tr><th colSpan={7} className="dry-horizontal-title">หมวดของแห้ง — {dryDateLabel(rows, dateRange)}</th></tr>
    <tr><th>สินค้า</th><th className="dry-horizontal-price">ราคา</th><th colSpan={4}>ลูกค้า</th><th className="dry-horizontal-total">รวม</th></tr></thead>
    {groups.flatMap(group => {
      const bands=[];
      for(let offset=0; offset<group.customers.length; offset+=SLOTS) {
        const cells=Array.from({length:SLOTS},(_,i)=>group.customers[offset+i]);
        const last=offset+SLOTS>=group.customers.length;
        bands.push(<tbody key={group.key+":"+offset}><tr>
          <td rowSpan={2} className="dry-horizontal-product">{group.name}{offset>0 && <small> (ต่อ)</small>}</td>
          <td rowSpan={2} className="dry-horizontal-price">{group.price == null ? "–" : group.price.toLocaleString("en-US",{maximumFractionDigits:2})}</td>
          {cells.map((c,i)=><th key={i} className={c ? "dry-horizontal-customer" : ""} title={c?.name}>{c?.code || ""}</th>)}
          <td rowSpan={2} className="dry-horizontal-total">{last && [...group.totals].map(([unit,qty])=><div key={unit}>{formatDryQuantity(qty)} {unit}</div>)}</td>
        </tr><tr>{cells.map((c,i)=><td key={i} className="dry-horizontal-quantity">{c ? formatDryQuantity(c.qty)+" "+c.unit : ""}</td>)}</tr></tbody>);
      }
      return bands;
    })}
    {!groups.length && <tbody><tr><td colSpan={7} className="dry-horizontal-empty">ไม่พบรายการของแห้งตามเงื่อนไขที่เลือก</td></tr></tbody>}
  </table></div>;
}
