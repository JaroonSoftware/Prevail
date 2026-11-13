import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, DatePicker, Empty, Form, Input, Select, message } from 'antd';
import { PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { requestService as api } from '../../../service/Request.service';
import OptionService from '../../../service/Options.service';
import { Authenticate } from '../../../service/Authenticate.service';
import HistoryDocument from './HistoryDocument';
import { REPORT_TITLES } from './reportHelpers';
import './history.css';

const optionsService=OptionService();
const defaultFilters=()=>({date_from:dayjs().startOf('month').format('YYYY-MM-DD'),date_to:dayjs().format('YYYY-MM-DD'),customer_from:'',customer_to:'',item_from:'',item_to:''});
/* mode='customer' รายงานประวัติการขาย แยกตามลูกค้า | mode='product' รายงานขาย แยกตามสินค้า (ฟอร์มเดียวกัน) */
export default function SalesHistoryCustomerReport({ mode = 'customer' }){
  const REPORT_TITLE = REPORT_TITLES[mode] || REPORT_TITLES.customer;
  const [form]=Form.useForm();
  const [customers,setCustomers]=useState([]),[loading,setLoading]=useState(false),[ready,setReady]=useState(false),[dirty,setDirty]=useState(false),[error,setError]=useState('');
  const [report,setReport]=useState(null);
  const sequence=useRef({value:0});
  const userId=Authenticate().getUserId();
  const storageKey='prevail-sales-history-filters:'+mode+':'+userId;
  const load=async filters=>{
    const request=++sequence.current.value;
    setLoading(true);setReady(false);setError('');setDirty(false);setReport(null);
    try {
      const res=await api.post('/reports/sales-history-customer/search.php',filters,{ignoreLoading:true});
      if(request!==sequence.current.value)return;
      const rows=res?.data?.data;
      if(!Array.isArray(rows))throw new Error('ข้อมูลรายงานไม่ถูกต้อง');
      setReport({data:rows,filters,generatedAt:res.data.generated_at||new Date().toISOString()});
      try{sessionStorage.setItem(storageKey,JSON.stringify(filters));}catch{}
    }catch(e){if(request===sequence.current.value){setError(e?.response?.data?.message||e.message||'โหลดรายงานไม่สำเร็จ');}}
    finally{if(request===sequence.current.value)setLoading(false);}
  };
  useEffect(()=>{
    let active=true;
    const requestState=sequence.current;
    optionsService.optionsCustomer().then(res=>{if(active)setCustomers((res?.data?.data||[]).map(c=>({value:c.cuscode,label:c.cuscode+' — '+c.cusname})));}).catch(()=>{if(active)message.warning('โหลดรายชื่อลูกค้าไม่สำเร็จ สามารถกรอกรหัสลูกค้าในช่องค้นหาได้');});
    let filters=defaultFilters(),restore=false;
    try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved&&dayjs(saved.date_from).isValid()&&dayjs(saved.date_to).isValid()){filters={...filters,...saved};restore=true;}}catch{}
    form.setFieldsValue({...filters,dates:[dayjs(filters.date_from),dayjs(filters.date_to)]});
    if(restore)load(filters);
    return()=>{active=false;requestState.value++;};
    // Filters are restored once for this signed-in user; searches are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[form,storageKey]);
  const search=async()=>{
    try{
      const v=await form.validateFields();
      await load({date_from:v.dates[0].format('YYYY-MM-DD'),date_to:v.dates[1].format('YYYY-MM-DD'),
        customer_from:(v.customer_from||'').trim(),customer_to:(v.customer_to||'').trim(),item_from:(v.item_from||'').trim(),item_to:(v.item_to||'').trim()});
    }catch(e){if(!e.errorFields)message.error('กรุณาตรวจสอบตัวกรองรายงาน');}
  };
  const customerField=name=><Form.Item name={name} label={name==='customer_from'?'รหัสลูกค้าจาก':'ถึงรหัสลูกค้า'}>
    <Input list={'history-customers-'+name} placeholder="ทั้งหมด" maxLength={40} />
  </Form.Item>;
  return <div className="history-report">
    <section className="history-toolbar">
      <h1>{REPORT_TITLE}</h1>
      <Form form={form} layout="vertical" size="large" onFinish={search} onValuesChange={()=>setDirty(true)}>
        <div className="history-filters">
          <Form.Item name="dates" label="ช่วงวันที่ใบส่งสินค้า" rules={[{required:true,message:'กรุณาเลือกช่วงวันที่'}]}><DatePicker.RangePicker allowClear={false} format="DD/MM/YYYY" /></Form.Item>
          {customerField('customer_from')}{customerField('customer_to')}
          <Form.Item name="item_from" label="รหัสสินค้าจาก"><Input placeholder="ทั้งหมด" maxLength={40} /></Form.Item>
          <Form.Item name="item_to" label="ถึงรหัสสินค้า"><Input placeholder="ทั้งหมด" maxLength={40} /></Form.Item>
          <Form.Item label="เลือกลูกค้ารายเดียว"><Select showSearch allowClear options={customers} optionFilterProp="label" placeholder="เลือกเพื่อกำหนดรหัสจาก–ถึง" onChange={value=>{form.setFieldsValue({customer_from:value||'',customer_to:value||''});setDirty(true);}} /></Form.Item>
        </div>
        <div className="history-actions">
          {report&&<span className="history-record-count">{report.data.length.toLocaleString()} รายการ</span>}
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>แสดงรายงาน</Button>
          <Button icon={<PrinterOutlined />} disabled={!ready||loading||dirty||!!error} onClick={()=>window.print()}>พิมพ์ / บันทึก PDF</Button>

        </div>
      </Form>
      {['customer_from','customer_to'].map(name=><datalist id={'history-customers-'+name} key={name}>{customers.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</datalist>)}
    </section>
    {dirty&&report&&<Alert className="history-status" type="info" message="ตัวกรองเปลี่ยนแล้ว กรุณากดแสดงรายงานอีกครั้งก่อนพิมพ์" />}
    {error&&<Alert className="history-status" showIcon type="error" message={error} />}
    {!report&&!loading&&!error&&<Empty description="เลือกเงื่อนไขแล้วกดแสดงรายงาน" />}
    {report&&(report.data.length?<HistoryDocument mode={mode} key={report.generatedAt} data={report.data} filters={report.filters} generatedAt={report.generatedAt} onReady={setReady} />:<Empty description="ไม่พบรายการในช่วงที่เลือก" />)}
  </div>;
}
