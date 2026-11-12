import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import DocumentLink from '../../../components/DocumentLink';
import { COMPANY_NAME, REPORT_TITLE, money, quantity, thaiDate, buildHistoryRows, paginateHistory } from './reportHelpers';
import './history.css';

const columns = [9,15,10,4,8,4,5,9,6,10,9,11];
const headings = ['สินค้า / วันที่','เลขที่เอกสาร','จำนวน','คืน','ราคาต่อหน่วย','VAT','ส่วนลด','รวมเงิน','ส่วนลดรวม','ยอดขายสุทธิ','อ้างอิง','หมายเหตุ'];
function Header({ filters, generatedAt, number, total }) {
  return <header className="history-page-header">
    <div className="history-headline"><strong>{COMPANY_NAME}</strong><span>หน้า : {number} / {total}</span></div>
    <h2>{REPORT_TITLE}</h2>
    <div className="history-headline"><span>รหัสลูกค้า {filters.customer_from || 'ทั้งหมด'} ถึง {filters.customer_to || 'ทั้งหมด'}</span><span>วันที่ : {thaiDate(generatedAt)}</span></div>
    <div>วันที่จาก {thaiDate(filters.date_from)} ถึง {thaiDate(filters.date_to)}</div>
    <div>รหัสสินค้า {filters.item_from || 'ทั้งหมด'} ถึง {filters.item_to || 'ทั้งหมด'}</div>
  </header>;
}
function ReportRow({ item, measure = false, ...props }) {
  if (['customer','product','note','end'].includes(item.type)) return <tr {...props} className={'history-' + item.type}><td colSpan={12}>{item.text}{item.continued ? ' (ต่อ)' : ''}</td></tr>;
  if (item.type === 'detail') {
    const r=item.row;
    return <tr {...props} className="history-detail">
      <td>{thaiDate(r.dndate)}</td>
      <td>{measure ? r.dncode : <DocumentLink type="dncode" code={r.dncode} />}</td>
      <td className="history-number">{quantity(r.qty)} <span>{r.unit || '-'}</span></td>
      <td className="history-number">–</td><td className="history-number">{money(r.price)}</td>
      <td className="history-number">{Number(r.vat) || 0}</td><td className="history-number">–</td>
      <td className="history-number">{money(r.line_subtotal)}</td><td className="history-number">–</td>
      <td className="history-number">{money(r.line_net_total)}</td>
      <td>{r.socode ? (measure ? r.socode : <DocumentLink type="socode" code={r.socode} />) : '–'}</td>
      <td className="history-remark">{r.remark || '–'}</td>
    </tr>;
  }
  const t=item.totals;
  return <tr {...props} className={'history-total history-' + item.type}>
    <td colSpan={2}>{item.label}</td>
    <td className="history-number">{t.units.map(u=><div key={u.unit}>{quantity(u.qty)} {u.unit}</div>)}</td>
    <td colSpan={4}></td><td className="history-number">{money(t.subtotal)}</td><td></td><td className="history-number">{money(t.net)}</td><td colSpan={2}></td>
  </tr>;
}
function ReportTable({ children }) {
  return <table className="history-table"><colgroup>{columns.map((width,i)=><col key={i} style={{width:width+'%'}} />)}</colgroup>
    <thead><tr>{headings.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table>;
}

export default function HistoryDocument({ data, filters, generatedAt, onReady }) {
  const rows=useMemo(()=>buildHistoryRows(data),[data]);
  const measureRef=useRef(null);
  /* Preview เต็มจอ: ขยายหน้ากระดาษ (zoom) ให้กว้างเท่าพื้นที่ — ขนาดจริง/การแบ่งหน้า/ตอนพิมพ์ไม่เปลี่ยน */
  const pagesRef=useRef(null);
  const [zoom,setZoom]=useState(1);
  useLayoutEffect(()=>{
    const el=pagesRef.current; if(!el||typeof ResizeObserver==='undefined') return;
    const PAPER_PX=297*96/25.4; // กว้างกระดาษ A4 แนวนอน (px) ไม่วัดจาก DOM เพราะค่าที่วัดได้รวม zoom แล้ว
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
    <style media="print">{'@page { size: Letter portrait; margin: 0; }'}</style>
    <div className="history-measure history-paper" ref={measureRef} aria-hidden="true">
      <Header filters={filters} generatedAt={generatedAt} number={1} total={999} />
      <ReportTable>{rows.map(item=><ReportRow key={item.id} item={item} measure data-history-row="true" />)}</ReportTable>
      <ReportTable>{repeatRows.map(item=><ReportRow key={item.id} item={item} measure data-history-repeat="true" />)}</ReportTable>
    </div>
    {layout.error ? <Alert type="error" showIcon message={layout.error} /> : !layout.pages.length ? <div className="history-loading"><Spin /> กำลังจัดหน้ารายงาน…</div> :
      <div className="history-pages" ref={pagesRef} style={{'--history-zoom':zoom}}>{layout.pages.map((page,index)=><article className="history-paper" key={index} aria-label={'รายงานหน้า '+(index+1)}>
        <Header filters={filters} generatedAt={generatedAt} number={index+1} total={layout.pages.length} />
        <ReportTable>{page.map((item,i)=><ReportRow key={item.id ?? 'repeat-'+i} item={item} />)}</ReportTable>
        <footer className="history-footer">{REPORT_TITLE} · หน้า {index+1} / {layout.pages.length}</footer>
      </article>)}</div>}
  </>;
}
