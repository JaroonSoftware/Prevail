import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, message } from 'antd';
import { requestService as api } from '../../service/Request.service';
const endpoint='/catalog/groups.php';
export default function CatalogGroupModal({open,onClose,onChanged}) {
 const [form]=Form.useForm();
 const [rows,setRows]=useState([]),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const reset=()=>{setEditing(null);form.resetFields();};
 const load=async()=>{setBusy(true);setError('');try{const r=await api.get(endpoint);setRows(r.data.data||[]);}catch(e){setError(e?.response?.data?.message||'โหลดหมวดไม่สำเร็จ');}finally{setBusy(false);}};
 useEffect(()=>{if(open){reset();load();}},[open]); // eslint-disable-line react-hooks/exhaustive-deps
 const mutate=async(method,v)=>{setBusy(true);setError('');try{
  const r=method==='delete'?await api.delete(endpoint+'?group_id='+v.group_id):await api[method](endpoint,v);
  const next=r.data.data||[];setRows(next);reset();onChanged?.(next);message.success('บันทึกหมวดเรียบร้อยแล้ว');
 }catch(e){setError(e?.response?.data?.message||'บันทึกหมวดไม่สำเร็จ');}finally{setBusy(false);}};
 return <Modal open={open} title="จัดการหมวดแค็ตตาล็อก" width={760} footer={null} onCancel={()=>{if(!busy)onClose();}} closable={!busy} maskClosable={!busy}>
  <Space direction="vertical" size="middle" style={{width:'100%'}}>
   <Alert type="info" showIcon message="หมวดใช้ร่วมกันทุกแค็ตตาล็อก ลบได้เฉพาะหมวดที่ไม่มีสินค้าอ้างอิง" />
   {error&&<Alert type="error" showIcon message={error} action={<Button disabled={busy} onClick={load}>โหลดใหม่</Button>} />}
   <Form form={form} layout="vertical" initialValues={{seq:0}} onFinish={v=>mutate(editing?'put':'post',{...v,group_id:editing})}>
    <Form.Item name="group_name" label="ชื่อหมวด" rules={[{required:true,whitespace:true,message:'กรุณาระบุชื่อหมวด'},{max:100}]}><Input maxLength={100} disabled={busy} /></Form.Item>
    <Form.Item name="seq" label="ลำดับ" rules={[{required:true}]}><InputNumber min={0} max={9999} precision={0} disabled={busy} /></Form.Item>
    <Space><Button htmlType="submit" type="primary" loading={busy}>{editing?'บันทึกแก้ไข':'เพิ่มหมวด'}</Button>{editing&&<Button onClick={reset} disabled={busy}>ยกเลิกแก้ไข</Button>}</Space>
   </Form>
   <Table rowKey="group_id" size="small" loading={busy} dataSource={rows} pagination={{pageSize:10}} columns={[
    {title:'ลำดับ',dataIndex:'seq',width:80},{title:'ชื่อหมวด',dataIndex:'group_name'},
    {title:'จัดการ',width:160,render:(_,r)=><Space>
     <Button size="small" disabled={busy} onClick={()=>{setEditing(r.group_id);form.setFieldsValue({group_name:r.group_name,seq:Number(r.seq)});}}>แก้ไข</Button>
     <Popconfirm title={'ลบหมวด '+r.group_name+' ?'} okText="ลบ" cancelText="กลับ" disabled={busy} onConfirm={()=>mutate('delete',{group_id:r.group_id})}><Button size="small" danger disabled={busy}>ลบ</Button></Popconfirm>
    </Space>}
   ]} />
  </Space>
 </Modal>;
}
