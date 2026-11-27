import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import DocumentLink from '../../../components/DocumentLink';
import { COMPANY_NAME, REPORT_TITLES, money, quantity, thaiDate, buildHistoryRows, paginateHistory } from './reportHelpers';
import './history.css';

/* 10 คอลัมน์ทั้งสองแบบ — ส่วนลด = ส่วนลด % ของใบส่งของ (มาจากใบขาย) แบ่งลงรายบรรทัด, ยอดขายสุทธิหักส่วนลดแล้ว
   แยกตามลูกค้า: แนวนอน | แยกตามสินค้า: แนวตั้ง มีรหัสลูกค้าในแถว ไม่มีคอลัมน์คืน */
const COLS = 10;
const columnsFor = mode => mode === 'product'
  ? [9,13,9,13,11,5,10,12,11,7]
  : [10,16,11,5,9,5,10,11,11,12];
const headingsFor = mode => mode === 'product'
  ? ['วันที่','เลขที่เอกสาร','รหัสลูกค้า','จำนวน','ราคาต่อหน่วย','VAT','ส่วนลด','ยอดขายสุทธิ','อ้างอิง','หมายเหตุ']
  : ['สินค้า / วันที่','เลขที่เอกสาร','จำนวน','คืน','ราคาต่อหน่วย','VAT','ส่วนลด','ยอดขายสุทธิ','อ้างอิง','หมายเหตุ'];
function Header({ filters, generatedAt, number, total, mode }) {
  const REPORT_TITLE = REPORT_TITLES[mode] || REPORT_TITLES.customer;
  return <header className="history-page-header">
    <div className="history-headline"><strong>{COMPANY_NAME}</strong><span>หน้า : {number} / {total}</span></div>
    <h2>{REPORT_TITLE}</h2>
    <div className="history-headline"><span>รหัสลูกค้า {filters.customer_from || 'ทั้งหมด'} ถึง {filters.customer_to || 'ทั้งหมด'}</span><span>วันที่ : {thaiDate(generatedAt)}</span></div>
    <div>วันที่จาก {thaiDate(filters.date_from)} ถึง {thaiDate(filters.date_to)}</div>
    <div>รหัสสินค้า {filters.item_from || 'ทั้งหมด'} ถึง {filters.item_to || 'ทั้งหมด'}</div>
  </header>;
}
function ReportRow({ item, measure = false, mode, ...props }) {
  const byProduct = mode === 'product';
  if (['customer','product','note','end'].includes(item.type)) return <tr {...props} className={'history-' + item.type}><td colSpan={COLS}>{item.text}{item.continued ? ' (ต่อ)' : ''}</td></tr>;
  if (item.type === 'detail') {
    const r=item.row;
    return <tr {...props} className="history-detail">
      <td>{thaiDate(r.dndate)}</td>
      <td>{measure ? r.dncode : <DocumentLink type="dncode" code={r.dncode} />}</td>
      {byProduct && <td>{r.cuscode || '–'}</td>}
      <td className="history-number">{quantity(r.qty)} <span>{r.unit || '-'}</span></td>
      {!byProduct && <td className="history-number">–</td>}<td className="history-number">{money(r.price)}</td>
      <td className="history-number">{Number(r.vat) || 0}</td>
      <td className="history-number">{r.line_discount > 0 ? money(r.line_discount) : '–'}</td>
      <td className="history-number">{money(r.line_net_total)}</td>
      <td>{r.socode ? (measure ? r.socode : <DocumentLink type="socode" code={r.socode} />) : '–'}</td>
      <td className="history-remark">{r.remark ? (String(r.remark).length > 150 ? String(r.remark).slice(0, 150) + '…' : r.remark) : '–'}</td>
    </tr>;
  }
  const t=item.totals;
  return <tr {...props} className={'history-total history-' + item.type}>
    <td colSpan={byProduct ? 3 : 2}>{item.label}</td>
    <td className="history-number">{t.units.map(u=><div key={u.unit}>{quantity(u.qty)} {u.unit}</div>)}</td>
    <td colSpan={byProduct ? 2 : 3}></td><td className="history-number">{t.discount > 0 ? money(t.discount) : ''}</td><td className="history-number">{money(t.net)}</td><td colSpan={2}></td>
  </tr>;
}
function ReportTable({ children, mode }) {
  const headings = headingsFor(mode);
  return <table className="history-table"><colgroup>{columnsFor(mode).map((width,i)=><col key={i} style={{width:width+'%'}} />)}</colgroup>
    <thead><tr>{headings.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table>;
}

export default function HistoryDocument({ data, filters, generatedAt, onReady, mode = 'customer' }) {
  const REPORT_TITLE = REPORT_TITLES[mode] || REPORT_TITLES.customer;
  const rows=useMemo(()=>buildHistoryRows(data, mode),[data, mode]);
  const measureRef=useRef(null);
  /* Preview เต็มจอ: ขยายหน้ากระดาษ (zoom) ให้กว้างเท่าพื้นที่ — ขนาดจริง/การแบ่งหน้า/ตอนพิมพ์ไม่เปลี่ยน */
  const pagesRef=useRef(null);
  const [zoom,setZoom]=useState(1);
  useLayoutEffect(()=>{
    const el=pagesRef.current; if(!el||typeof ResizeObserver==='undefined') return;
    const PAPER_PX=(mode==='product'?210:297)*96/25.4; // กว้างกระดาษ A4 แนวนอน (px) ไม่วัดจาก DOM เพราะค่าที่วัดได้รวม zoom แล้ว
    const fit=()=>setZoom(Math.max(1,Math.round(((el.clientWidth-32)/PAPER_PX)*100)/100));
    fit(); const ro=new ResizeObserver(fit); ro.observe(el); return ()=>ro.disconnect();
  });
  const [layout,setLayout]=useState({pages:[],error:null});
  const repeatRows=useMemo(()=>rows.filter(r=>['customer','product'].includes(r.type)).map(r=>({...r,continued:true})),[rows]);
  useLayoutEffect(()=>{
    let active=true;
    setLayout({pages:[],error:null}); onReady(false);
    const measure=()=>{
      if(!active || !measureRef.current)return;
      try {
        const paper=measureRef.current,style=getComputedStyle(paper);
        const capacity=paper.getBoundingClientRect().height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)
          -paper.querySelector('.history-page-header').getBoundingClientRect().height
          -paper.querySelector('thead').getBoundingClientRect().height-26;
        const heights=[...paper.querySelectorAll('[data-history-row]')].map(el=>el.getBoundingClientRect().height);
        const repeatHeights=new Map();
        paper.querySelectorAll('[data-history-repeat]').forEach((el,i)=>repeatHeights.set(repeatRows[i].type+repeatRows[i].text,el.getBoundingClientRect().height));
        const pages=paginateHistory(rows,heights,capacity,r=>repeatHeights.get(r.type+r.text)||24);
        setLayout({pages,error:null});onReady(true);
      } catch(error) { setLayout({pages:[],error:error.message});onReady(false); }
    };
    Promise.resolve(document.fonts?.ready).then(measure);
    return ()=>{active=false;};
  },[rows,repeatRows,filters,generatedAt,onReady]);
  return <>
    <style media="print">{mode === 'product' ? '@page { size: A4 portrait; margin: 0; }' : '@page { size: A4 landscape; margin: 0; }'}</style>
    <div className={"history-measure history-paper" + (mode === "product" ? " history-portrait" : "")} ref={measureRef} aria-hidden="true">
      <Header mode={mode} filters={filters} generatedAt={generatedAt} number={1} total={999} />
      <ReportTable mode={mode}>{rows.map(item=><ReportRow mode={mode} key={item.id} item={item} measure data-history-row="true" />)}</ReportTable>
      <ReportTable mode={mode}>{repeatRows.map(item=><ReportRow mode={mode} key={item.id} item={item} measure data-history-repeat="true" />)}</ReportTable>
    </div>
    {layout.error ? <Alert type="error" showIcon message={layout.error} /> : !layout.pages.length ? <div className="history-loading"><Spin /> กำลังจัดหน้ารายงาน…</div> :
      <div className="history-pages" ref={pagesRef} style={{'--history-zoom':zoom}}>{layout.pages.map((page,index)=><article className={"history-paper" + (mode === "product" ? " history-portrait" : "")} key={index} aria-label={'รายงานหน้า '+(index+1)}>
        <Header mode={mode} filters={filters} generatedAt={generatedAt} number={index+1} total={layout.pages.length} />
        <ReportTable mode={mode}>{page.map((item,i)=><ReportRow mode={mode} key={item.id ?? 'repeat-'+i} item={item} />)}</ReportTable>
        <footer className="history-footer">{REPORT_TITLE} · หน้า {index+1} / {layout.pages.length}</footer>
      </article>)}</div>}
  </>;
}
