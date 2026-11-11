/* ============================================================================
   เที่ยวรถ (สายส่ง) — เพิ่ม/แก้เที่ยวรถ และผูกลูกค้าเข้าเที่ยว
   ชื่อเที่ยวรถแสดงบนสติ๊กเกอร์หน้าถุง เช่น "5.ป่าตอง-กมลา"
   ลูกค้า 1 รายอยู่ได้ 1 เที่ยว (เพิ่มเข้าเที่ยวใหม่ = ย้ายออกจากเที่ยวเดิม)
   ============================================================================ */
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Flex, Input, Modal, Row, Select, Space, Tag, Typography, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { requestService as api } from "../../service/Request.service";

const URL = "/trip/manage.php";

export default function DeliveryTrip() {
  const [trips, setTrips] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null); // { trip_id?, trip_no, trip_name }
  const [pick, setPick] = useState({}); // trip_id -> [cuscode]

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(URL, { ignoreLoading: true });
      setTrips(r?.data?.data?.trips || []);
      setUnassigned(r?.data?.data?.unassigned || []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "โหลดข้อมูลเที่ยวรถไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ตัวเลือกลูกค้าทั้งหมด พร้อมบอกว่าอยู่เที่ยวไหนอยู่แล้ว */
  const cusOptions = useMemo(() => {
    const opts = unassigned.map((c) => ({ value: c.cuscode, label: `${c.cuscode} - ${c.cusname}` }));
    trips.forEach((t) => t.customers.forEach((c) =>
      opts.push({ value: c.cuscode, label: `${c.cuscode} - ${c.cusname} (อยู่เที่ยว ${t.trip_no})`, trip: t.trip_id })));
    return opts.sort((a, b) => a.value.localeCompare(b.value));
  }, [trips, unassigned]);

  const call = async (fn, ok) => {
    try { await fn(); if (ok) message.success(ok); await load(); }
    catch (e) { message.error(e?.response?.data?.message || "ทำรายการไม่สำเร็จ"); }
  };

  const saveTrip = () => call(async () => {
    if (!edit?.trip_no?.trim() || !edit?.trip_name?.trim()) throw { response: { data: { message: "กรุณากรอกเลขเที่ยวและชื่อเที่ยวรถ" } } };
    await (edit.trip_id ? api.put(URL, edit) : api.post(URL, edit));
    setEdit(null);
  }, "บันทึกเที่ยวรถแล้ว");

  const removeTrip = (t) => Modal.confirm({
    title: `ลบเที่ยว ${t.trip_no}.${t.trip_name}?`,
    content: `ลูกค้า ${t.customers.length} รายในเที่ยวนี้จะกลายเป็น "ยังไม่มีเที่ยวรถ"`,
    okText: "ลบ", okType: "danger", cancelText: "ยกเลิก",
    onOk: () => call(() => api.delete(`${URL}?trip_id=${t.trip_id}`), "ลบเที่ยวรถแล้ว"),
  });

  const assign = (t) => {
    const codes = pick[t.trip_id] || [];
    if (!codes.length) return;
    const moving = cusOptions.filter((o) => codes.includes(o.value) && o.trip && o.trip !== t.trip_id);
    const go = () => call(async () => {
      await api.post(URL, { action: "assign", trip_id: t.trip_id, cuscodes: codes });
      setPick((s) => ({ ...s, [t.trip_id]: [] }));
    }, `เพิ่มลูกค้าเข้าเที่ยว ${t.trip_no} แล้ว`);
    if (!moving.length) return go();
    Modal.confirm({
      title: "ย้ายลูกค้าจากเที่ยวเดิม?",
      content: moving.map((m) => <div key={m.value}>{m.label}</div>),
      okText: "ย้าย", cancelText: "ยกเลิก", onOk: go,
    });
  };

  const unassign = (c) => call(() => api.post(URL, { action: "unassign", cuscode: c.cuscode }));

  const q = search.trim().toLowerCase();
  const match = (c) => !q || c.cuscode.toLowerCase().includes(q) || (c.cusname || "").toLowerCase().includes(q);

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex", padding: 8 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Typography.Title level={3} className="m-0 !text-zinc-800">เที่ยวรถ (สายส่ง)</Typography.Title>
        <Space wrap>
          <Input allowClear placeholder="ค้นหารหัส/ชื่อลูกค้า" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEdit({ trip_no: "", trip_name: "" })}>เพิ่มเที่ยวรถ</Button>
        </Space>
      </Flex>
      <Typography.Text type="secondary">ชื่อเที่ยวรถจะพิมพ์บนสติ๊กเกอร์หน้าถุง เช่น “5.ป่าตอง-กมลา” · ลูกค้า 1 รายอยู่ได้ 1 เที่ยว</Typography.Text>
      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[12, 12]}>
        {trips.map((t) => {
          const shown = t.customers.filter(match);
          if (q && !shown.length) return null;
          return (
            <Col key={t.trip_id} xs={24} md={12} xl={8}>
              <Card size="small" loading={loading}
                title={<><Tag color="green">{t.trip_no}</Tag>{t.trip_name} <Typography.Text type="secondary">({t.customers.length})</Typography.Text></>}
                extra={<Space size={4}>
                  <Button size="small" icon={<EditOutlined />} onClick={() => setEdit({ ...t })} />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeTrip(t)} />
                </Space>}>
                <Flex wrap="wrap" gap={4} style={{ marginBottom: 8, minHeight: 24 }}>
                  {shown.map((c) => (
                    <Tag key={c.cuscode} closable onClose={(e) => { e.preventDefault(); unassign(c); }} title={c.cusname}>{c.cuscode}</Tag>
                  ))}
                </Flex>
                <Flex gap={4}>
                  <Select mode="multiple" size="small" style={{ flex: 1 }} placeholder="เพิ่มลูกค้า" showSearch optionFilterProp="label"
                    options={cusOptions.filter((o) => o.trip !== t.trip_id)} value={pick[t.trip_id] || []}
                    onChange={(v) => setPick((s) => ({ ...s, [t.trip_id]: v }))} maxTagCount="responsive" />
                  <Button size="small" type="primary" onClick={() => assign(t)} disabled={!(pick[t.trip_id] || []).length}>เพิ่ม</Button>
                </Flex>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card size="small" title={<>ลูกค้าที่ยังไม่มีเที่ยวรถ <Tag color="orange">{unassigned.length}</Tag></>}>
        <Flex wrap="wrap" gap={4}>
          {unassigned.filter(match).map((c) => <Tag key={c.cuscode} title={c.cusname}>{c.cuscode}</Tag>)}
        </Flex>
      </Card>

      <Modal open={!!edit} title={edit?.trip_id ? "แก้ไขเที่ยวรถ" : "เพิ่มเที่ยวรถ"} onCancel={() => setEdit(null)} onOk={saveTrip} okText="บันทึก" cancelText="ยกเลิก">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input addonBefore="เลขเที่ยว" placeholder="เช่น 16" value={edit?.trip_no} onChange={(e) => setEdit((s) => ({ ...s, trip_no: e.target.value }))} />
          <Input addonBefore="ชื่อเที่ยว" placeholder="เช่น ป่าตอง-กมลา" value={edit?.trip_name} onChange={(e) => setEdit((s) => ({ ...s, trip_name: e.target.value }))} />
          <Typography.Text type="secondary">บนสติ๊กเกอร์จะแสดงเป็น “{edit?.trip_no || "?"}.{edit?.trip_name || "?"}”</Typography.Text>
        </Space>
      </Modal>
    </Space>
  );
}
