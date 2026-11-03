import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Space, Spin } from 'antd';
import { useReactToPrint } from 'react-to-print';
import CatalogService from '../../../service/Catalog.Service';
import OptionService from '../../../service/Options.service';
import { catalogPages } from './catalogPrintModel';
import './catalog-print.css';
const service=CatalogService(),options=OptionService();
const date=(value)=>{if(!value)return '-';const d=new Date(value+'T00:00:00');return Number.isNaN(d.getTime())?value:d.toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'});};
const price=(v)=>v==null||v===''?'-':Number.isFinite(Number(v))?Number(v).toLocaleString('en-US',{maximumFractionDigits:2}):String(v);
function ProductTable({rows}){return <table><colgroup><col style={{width:'7%'}}/><col style={{width:'34%'}}/><col style={{width:'32%'}}/><col style={{width:'12%'}}/><col style={{width:'15%'}}/></colgroup>
 <thead><tr><th>ลำดับ</th><th colSpan={2}>รายการสินค้า</th><th>หน่วย</th><th>ราคา</th></tr></thead>
 <tbody>{rows.map(r=><tr key={r.printNo}><td className="cp-center">{r.printNo}</td><td>{r.stname}</td><td>{r.stnameEN||''}</td><td className="cp-center">{r.unit}</td><td className="cp-price">{price(r.price)}</td></tr>)}</tbody></table>;}
export function CatalogSheets({header,detail,groups}){const pages=useMemo(()=>catalogPages(detail,groups),[detail,groups]);return <div className="catalog-print-document">
 {pages.map((p,i)=><section className="catalog-print-sheet" key={i}>
  <header><div><h1>Prevail International Food Co.,Ltd</h1><div>60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000</div><div>TEL. 098-1929391 · ID LINE : 0981929391</div><div>E-mail : prevailinternational89@gmail.com</div></div><div className="cp-brand"><strong>{header.catalog_name}</strong><div>PHUKET</div><div>{header.catalog_code}</div></div></header>
  <div className="cp-period">ราคาวันที่ {date(header.start_date)} – {date(header.stop_date)}</div>
  <div className="cp-group">{p.group}</div>
  <div className="cp-columns"><ProductTable rows={p.left}/><ProductTable rows={p.right}/></div>
  <footer><span>{header.catalog_name}</span><span>หน้า {i+1} / {pages.length}</span></footer>
 </section>)}
 </div>;}
export default function CatalogPrintPreview(){const {code}=useParams();const ref=useRef(null);const [data,setData]=useState(null),[groups,setGroups]=useState([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;setData(null);setError('');Promise.all([service.get(code),options.optionsCatalogGroup()]).then(([r,g])=>{if(!active)return;if(!r.data?.data?.header)throw Error('ไม่พบแค็ตตาล็อก');setData(r.data.data);setGroups(g.data?.data||[]);}).catch(e=>{if(active)setError(e?.response?.data?.message||e.message||'โหลดข้อมูลไม่สำเร็จ');});return()=>{active=false;};},[code]);
 const print=useReactToPrint({documentTitle:'Catalog-'+code,removeAfterPrint:true,pageStyle:'@page { size: A4 portrait; margin: 0; }'});
 return <div className="catalog-print-preview"><Space className="cp-toolbar"><Button onClick={()=>window.history.back()}>กลับ</Button><Button type="primary" style={data?.detail?.length ? { backgroundColor: "#fadb14", borderColor: "#d4b106", color: "#262626" } : undefined} disabled={!data?.detail?.length} onClick={()=>print(null,()=>ref.current)}>พิมพ์ / บันทึก PDF</Button><span>พิมพ์จากข้อมูลที่บันทึกแล้ว • A4 แนวตั้ง</span></Space>
 {error?<Alert type="error" message={error}/>:!data?<Spin/>:!data.detail?.length?<Alert type="info" message="แค็ตตาล็อกนี้ยังไม่มีสินค้า"/>:<div ref={ref}><CatalogSheets header={data.header} detail={data.detail} groups={groups}/></div>}</div>;
}
