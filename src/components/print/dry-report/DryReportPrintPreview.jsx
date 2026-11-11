import "../print-font.css";
import React, { useEffect, useRef, useState } from "react";
import { Button, Alert, Spin } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import ReportService from "../../../service/Report.service";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";
import DryGoodsSummary from "./DryGoodsSummary";
const service = ReportService();
export default function DryReportPrintPreview() {
  const ref = useRef(null);
  const [rows,setRows] = useState([]);
  const [range,setRange] = useState();
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);
  const print = useReactToPrint({ documentTitle:"รายงานของแห้ง", removeAfterPrint:true, pageStyle:"@page { size:210mm 297mm; margin:8mm; } @page dryHorizontal { size:210mm 297mm; margin:8mm; } html, body { margin:0 !important; padding:0 !important; background:white !important; }" });
  useEffect(()=>{
    let active=true;
    const values=loadMyAccessSearchCookie("dry-report")?.searchValues || {};
    const payload={...values};
    setRange(values.sodate);
    if(Array.isArray(values.sodate) && values.sodate.length===2) {
      [payload.sodate_form,payload.sodate_to]=values.sodate.map(v=>dayjs(v).format("YYYY-MM-DD"));
    }
    delete payload.sodate;
    service.getDryGoods(payload,{ignoreLoading:true}).then(res=>{if(active)setRows(Array.isArray(res.data.data)?res.data.data:[]);})
      .catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  return <div className="dry-horizontal-preview">
    <div className="dry-horizontal-toolbar"><h1>รายงานของแห้ง</h1><Button type="primary" icon={<PrinterOutlined/>} disabled={loading || error || !rows.length} onClick={()=>print(null,()=>ref.current)}>พิมพ์ / บันทึก PDF</Button></div>
    {error && <Alert type="error" showIcon message="โหลดรายงานไม่สำเร็จ กรุณาลองใหม่"/>}
    <Spin spinning={loading}><div ref={ref} className="dry-horizontal-paper"><DryGoodsSummary rows={rows} dateRange={range}/></div></Spin>
  </div>;
}
