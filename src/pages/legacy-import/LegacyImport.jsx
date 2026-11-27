/* ============================================================================
   นำเข้าใบขายข้อมูลเก่า — /legacy-import
   อัปโหลด PDF "รายงานประวัติการขาย แยกตามลูกค้า" จากระบบเก่า -> AI สรุปยอดรายใบ
   -> ติ๊กเลือก -> บันทึก (นำไปวางบิลรวมกับใบส่งของได้ที่หน้าใบวางบิล)
   ============================================================================ */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Empty, Flex, Input, InputNumber, Modal, Progress, Row, Segmented, Space, Statistic, Steps, Table, Tag, Typography, Upload, message } from "antd";
import { CheckCircleFilled, EditOutlined, EyeOutlined, FilePdfOutlined, HistoryOutlined, InboxOutlined, ReloadOutlined, SaveOutlined, SearchOutlined, WarningFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import { requestService as api } from "../../service/Request.service";

const URL = "/ai/legacy-import.php";
const money = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const d = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("DD/MM/YYYY") : "-");
const errMsg = (e, fb) => e?.response?.data?.message || fb;

export default function LegacyImport() {
  const [file, setFile] = useState(null);
  const [cuscode, setCuscode] = useState("");
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState(null);
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState([]);
  const [listStatus, setListStatus] = useState("pending");
  const [listLoading, setListLoading] = useState(false);
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState({}); // ยอดที่ผู้ใช้แก้ {doc_no: amount}
  const [preview, setPreview] = useState(null); // { doc_no, page }
  const [pdfUrl, setPdfUrl] = useState(null);
  const [editRow, setEditRow] = useState(null); // ใบในระบบที่กำลังแก้ยอด
  const [editVal, setEditVal] = useState(0);

  const amountOf = useCallback((x) => (edits[x.doc_no] ?? Number(x.amount)), [edits]);
  const allTotal = useMemo(() => (result?.docs || []).reduce((s, x) => s + amountOf(x), 0), [result, amountOf]);
  const totalMatch = result?.report_total != null && Math.abs(Number(result.report_total) - allTotal) < 0.01;

  /* โหลด PDF ต้นฉบับครั้งเดียวต่อไฟล์ แล้วเปิดไปหน้าที่ใบนั้นอยู่ */
  const openPreview = async (row) => {
    setPreview({ doc_no: row.doc_no, page: row.page || 1 });
    if (pdfUrl) return;
    try {
      const r = await api.get(`${URL}?action=file&import_id=${result.import_id}`, { ignoreLoading: true, responseType: "blob" });
      setPdfUrl(window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" })));
    } catch (e) {
      message.error("เปิดไฟล์ต้นฉบับไม่สำเร็จ");
      setPreview(null);
    }
  };
  useEffect(() => () => { if (pdfUrl) window.URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const r = await api.get(`${URL}?status=${listStatus}`, { ignoreLoading: true });
      setList(r?.data?.data || []);
    } catch (e) {
      message.error(errMsg(e, "โหลดรายการไม่สำเร็จ"));
    } finally {
      setListLoading(false);
    }
  }, [listStatus]);

  useEffect(() => { loadList(); }, [loadList]);

  const read = () => {
    if (!file) return message.warning("เลือกไฟล์ PDF ก่อน");
    Modal.confirm({
      title: "ให้ AI อ่านไฟล์นี้?",
      content: `${file.name} — การอ่านด้วย AI มีค่าใช้จ่าย (ไฟล์หลายสิบหน้าใช้เวลาหลายนาที)`,
      okText: "อ่านไฟล์", cancelText: "ยกเลิก",
      onOk: async () => {
        setReading(true); setResult(null);
        try {
          const fd = new FormData();
          fd.append("file", file);
          if (cuscode.trim()) fd.append("cuscode", cuscode.trim());
          const r = await api.post(URL, fd, { ignoreLoading: true, timeout: 960000 });
          const data = r?.data?.data;
          setResult(data);
          setEdits({});
          setPdfUrl(null);
          setCuscode(data?.customer?.cuscode || cuscode || data?.customer_code_read || "");
          setPicked((data?.docs || []).map((x) => x.doc_no));
        } catch (e) {
          message.error(errMsg(e, "อ่านไฟล์ไม่สำเร็จ"));
        } finally {
          setReading(false);
        }
      },
    });
  };

  const pickedTotal = useMemo(() => (result?.docs || []).filter((x) => picked.includes(x.doc_no)).reduce((s, x) => s + amountOf(x), 0), [result, picked, amountOf]);

  const save = async () => {
    if (!cuscode.trim()) return message.warning("ระบุรหัสลูกค้า");
    if (!picked.length) return message.warning("เลือกอย่างน้อย 1 ใบ");
    const doSave = async () => {
      setSaving(true);
      try {
        const r = await api.post(URL, { import_id: result.import_id, cuscode: cuscode.trim(), doc_nos: picked, amounts: edits }, { ignoreLoading: true });
        const s = r?.data?.data || {};
        message.success(`บันทึกแล้ว ${s.saved} ใบ` + (s.renamed?.length ? ` · เลขซ้ำ ${s.renamed.length} ใบ บันทึกเป็น ${s.renamed.slice(0, 3).join(", ")}${s.renamed.length > 3 ? " …" : ""}` : ""), 6);
        setResult(null); setFile(null); setPicked([]); setEdits({}); setPdfUrl(null);
        loadList();
      } catch (e) {
        message.error(errMsg(e, "บันทึกไม่สำเร็จ"));
      } finally {
        setSaving(false);
      }
    };
    if (!totalMatch) {
      Modal.confirm({
        title: "ยอดรวมไม่ตรงกับรายงาน",
        content: `ยอดรวมทุกใบ ${money(allTotal)} · ยอดรวมทั้งสิ้นในรายงาน ${result.report_total == null ? "อ่านไม่พบ" : money(result.report_total)} — ตรวจสอบยอดรายใบก่อน ยืนยันบันทึกหรือไม่?`,
        okText: "บันทึก", cancelText: "ยกเลิก", okButtonProps: { danger: true }, onOk: doSave,
      });
    } else doSave();
  };

  const cancelDoc = (row) => Modal.confirm({
    title: `ยกเลิกใบ ${row.doc_no}?`, okText: "ยกเลิกใบ", cancelText: "ปิด", okButtonProps: { danger: true },
    onOk: async () => {
      try { await api.post(URL, { action: "cancel", id: row.id }, { ignoreLoading: true }); loadList(); }
      catch (e) { message.error(errMsg(e, "ยกเลิกไม่สำเร็จ")); }
    },
  });

  const readCols = [
    { title: "เลขที่เอกสาร", dataIndex: "doc_no", width: 140 },
    { title: "วันที่", dataIndex: "date", width: 120, render: d },
    { title: "จำนวนบรรทัด", dataIndex: "lines", width: 110, align: "right" },
    { title: "ยอดขายสุทธิ (แก้ไขได้)", key: "amount", width: 190, align: "right", render: (_, r) => (
      <InputNumber value={amountOf(r)} min={0} precision={2} style={{ width: "100%", height: 32 }}
        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(v) => (v || "").replace(/,/g, "")}
        status={edits[r.doc_no] !== undefined && edits[r.doc_no] !== Number(r.amount) ? "warning" : undefined}
        onChange={(v) => setEdits((e) => {
          const n = { ...e };
          if (v === null || Number(v) === Number(r.amount)) delete n[r.doc_no]; else n[r.doc_no] = Number(v);
          return n;
        })} />) },
    { title: "หมายเหตุ", key: "note", render: (_, r) => (
      <Space size={4} wrap>
        {r.exists && <Tag color="purple">เคยนำเข้าแล้ว (บันทึกซ้ำได้)</Tag>}
        {Number(r.unclear) > 0 && <Tag color="orange">อ่านไม่ชัด {r.unclear} บรรทัด</Tag>}
        {edits[r.doc_no] !== undefined && <Tag color="gold">แก้ไขแล้ว · AI อ่าน {money(r.amount)}</Tag>}
      </Space>) },
    { title: "ต้นฉบับ", key: "pv", width: 110, align: "center", render: (_, r) => (
      <Button size="small" type={Number(r.unclear) > 0 ? "primary" : "default"} ghost={Number(r.unclear) > 0}
        icon={<EyeOutlined />} onClick={() => openPreview(r)}>หน้า {r.page || "?"}</Button>) },
  ];

  const ql = q.trim().toLowerCase();
  const shownList = list.filter((r) => !ql || r.doc_no.toLowerCase().includes(ql) || r.cuscode.toLowerCase().includes(ql) || (r.cusname || "").toLowerCase().includes(ql));
  const listCols = [
    { title: "เลขที่เอกสาร", dataIndex: "doc_no", width: 130 },
    { title: "วันที่", dataIndex: "doc_date", width: 110, render: d },
    { title: "รหัสลูกค้า", dataIndex: "cuscode", width: 110 },
    { title: "ชื่อลูกค้า", dataIndex: "cusname", ellipsis: true },
    { title: "ยอดสุทธิ", dataIndex: "total", width: 160, align: "right", render: (v, r) => (
      <Space size={4}>{money(v)}
        {!r.blcode && <Button size="small" type="text" icon={<EditOutlined />} title="แก้ไขยอด"
          onClick={() => { setEditRow(r); setEditVal(Number(v)); }} />}
      </Space>) },
    { title: "สถานะ", key: "st", width: 160, render: (_, r) => (r.blcode ? <Tag color="green">วางบิลแล้ว {r.blcode}</Tag> : <Tag color="blue">รอวางบิล</Tag>) },
    { title: "", key: "act", width: 90, render: (_, r) => (!r.blcode ? <Button size="small" danger onClick={() => cancelDoc(r)}>ยกเลิก</Button> : null) },
  ];

  const step = result ? 1 : reading ? 0 : file ? 0 : 0;
  const docsCount = result?.docs?.length || 0;
  const existCount = (result?.docs || []).filter((x) => x.exists).length;
  const H = 38; // ความสูง input/ปุ่มเท่ากันทุกตัว

  return (
    <Flex vertical gap={16} style={{ padding: 8 }}>
      {/* หัวหน้า */}
      <Card styles={{ body: { padding: "18px 22px" } }}
        style={{ background: "linear-gradient(120deg,#3a6e3e 0%,#5c9a58 100%)", border: "none" }}>
        <Flex align="center" gap={16} wrap="wrap">
          <Flex align="center" justify="center" style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.18)" }}>
            <HistoryOutlined style={{ fontSize: 26, color: "#fff" }} />
          </Flex>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Typography.Title level={3} style={{ margin: 0, color: "#fff" }}>นำเข้าใบขายข้อมูลเก่า</Typography.Title>
            <Typography.Text style={{ color: "rgba(255,255,255,.85)" }}>
              อัปโหลด PDF "รายงานประวัติการขาย แยกตามลูกค้า" จากระบบเก่า — AI รวมยอดรายใบ แล้วนำไปวางบิลรวมกับใบส่งของได้
            </Typography.Text>
          </div>
        </Flex>
      </Card>

      <Card>
        <Steps size="small" current={step} style={{ marginBottom: 20 }} items={[
          { title: "อัปโหลดไฟล์", description: "PDF รายงานระบบเก่า" },
          { title: "ตรวจยอดรายใบ", description: "เทียบยอดรวมทั้งสิ้น" },
          { title: "บันทึก", description: "พร้อมวางบิล" },
        ]} />

        {!result && (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Upload.Dragger accept="application/pdf" maxCount={1} disabled={reading} showUploadList={false}
                beforeUpload={(f) => { setFile(f); return false; }} style={{ padding: 8, background: "#f7faf7" }}>
                {file ? (
                  <Flex vertical align="center" gap={6}>
                    <FilePdfOutlined style={{ fontSize: 40, color: "#cf1322" }} />
                    <Typography.Text strong>{file.name}</Typography.Text>
                    <Typography.Text type="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB · คลิกเพื่อเปลี่ยนไฟล์</Typography.Text>
                  </Flex>
                ) : (
                  <>
                    <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: "#3a6e3e" }} /></p>
                    <p className="ant-upload-text">ลากไฟล์ PDF มาวาง หรือคลิกเพื่อเลือก</p>
                    <p className="ant-upload-hint">รองรับไฟล์ PDF จากระบบเก่า หลายสิบหน้าได้</p>
                  </>
                )}
              </Upload.Dragger>
            </Col>
            <Col xs={24} md={10}>
              <Flex vertical gap={12} style={{ height: "100%" }}>
                <div>
                  <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>รหัสลูกค้า</Typography.Text>
                  <Input style={{ height: H }} placeholder="ไม่ระบุ = ใช้รหัสจากหัวรายงาน" value={cuscode} onChange={(e) => setCuscode(e.target.value)} />
                </div>
                <Button type="primary" block style={{ height: H }} loading={reading} disabled={!file} onClick={read}>
                  ให้ AI อ่านไฟล์
                </Button>
                {reading ? (
                  <Alert type="info" showIcon message="กำลังอ่านไฟล์…" description="อาจใช้เวลาหลายนาที กรุณาอย่าปิดหน้านี้" />
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    เช่น บรรทัด IV0371320-1 ถึง -14 จะรวมเป็นใบ IV0371320 ใบเดียว · การอ่านด้วย AI มีค่าใช้จ่าย ระบบจะถามยืนยันก่อน
                  </Typography.Text>
                )}
              </Flex>
            </Col>
          </Row>
        )}

        {result && (
          <Flex vertical gap={16}>
            <Row gutter={[12, 12]}>
              {[
                { t: "จำนวนใบ", v: docsCount, suffix: existCount ? `(เคยนำเข้า ${existCount})` : "", p: 0 },
                { t: Object.keys(edits).length ? `ยอดรวมทุกใบ (แก้ไข ${Object.keys(edits).length} ใบ)` : "ยอดที่ AI อ่าน", v: allTotal, p: 2 },
                { t: "ยอดรวมทั้งสิ้นในรายงาน", v: result.report_total ?? "-", p: 2 },
              ].map((x) => (
                <Col xs={24} sm={8} key={x.t}>
                  <Card size="small" style={{ background: "#f7faf7" }}>
                    <Statistic title={x.t} value={x.v} precision={typeof x.v === "number" ? x.p : undefined} suffix={<span style={{ fontSize: 13, color: "#888" }}>{x.suffix}</span>} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Alert showIcon type={totalMatch ? "success" : "warning"}
              icon={totalMatch ? <CheckCircleFilled /> : <WarningFilled />}
              message={totalMatch ? "ยอดรวมตรงกับรายงาน พร้อมบันทึก"
                : `ยอดรวมไม่ตรงกับรายงาน${result.report_total != null ? ` (ต่าง ${money(allTotal - Number(result.report_total))})` : ""} — กด "หน้า X" เพื่อดูต้นฉบับ แล้วแก้ยอดในตารางได้`}
              description={`${file?.name || ""} · ${result.pages} หน้า${result.period ? " · " + result.period : ""}${result.mock ? " · MOCK" : ""}`} />

            <Flex gap={12} align="end" wrap="wrap">
              <div style={{ width: 220 }}>
                <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>รหัสลูกค้า</Typography.Text>
                <Input style={{ height: H }} value={cuscode} onChange={(e) => setCuscode(e.target.value)} />
              </div>
              <Typography.Text strong style={{ lineHeight: `${H}px` }}>
                {result.customer?.cusname || (result.customer_code_read ? `รหัสในรายงาน: ${result.customer_code_read}` : "")}
              </Typography.Text>
            </Flex>

            <Table rowKey="doc_no" size="small" bordered columns={readCols} dataSource={result.docs} pagination={false} scroll={{ y: 420 }}
              rowSelection={{ selectedRowKeys: picked, onChange: setPicked }} />

            <Card size="small" style={{ background: "#f0f7f0", borderColor: "#cfe3cf" }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex align="center" gap={16}>
                  <Progress type="circle" size={44} percent={docsCount ? Math.round((picked.length / docsCount) * 100) : 0} strokeColor="#3a6e3e" />
                  <span style={{ fontSize: 15 }}>เลือก <b>{picked.length}</b> / {docsCount} ใบ · ยอดรวม <b style={{ color: "#3a6e3e", fontSize: 18 }}>{money(pickedTotal)}</b></span>
                </Flex>
                <Space>
                  <Button style={{ height: H }} onClick={() => { setResult(null); setPicked([]); }}>อ่านไฟล์ใหม่</Button>
                  <Button type="primary" style={{ height: H }} icon={<SaveOutlined />} loading={saving} onClick={save}>บันทึกเป็นใบขายข้อมูลเก่า</Button>
                </Space>
              </Flex>
            </Card>
          </Flex>
        )}
      </Card>

      <Card title={<Space><HistoryOutlined />ใบขายข้อมูลเก่าในระบบ</Space>}
        extra={<Button icon={<ReloadOutlined />} onClick={loadList}>รีเฟรช</Button>}>
        <Flex justify="space-between" wrap="wrap" gap={12} style={{ marginBottom: 12 }}>
          <Segmented value={listStatus} onChange={setListStatus} options={[
            { value: "pending", label: "รอวางบิล" }, { value: "billed", label: "วางบิลแล้ว" }, { value: "all", label: "ทั้งหมด" }]} />
          <Input allowClear prefix={<SearchOutlined />} placeholder="ค้นหาเลขที่ / รหัส / ชื่อลูกค้า" value={q}
            onChange={(e) => setQ(e.target.value)} style={{ width: 280, height: H }} />
        </Flex>
        <Table rowKey="id" size="small" loading={listLoading} columns={listCols} dataSource={shownList}
          locale={{ emptyText: <Empty description="ยังไม่มีใบขายข้อมูลเก่า" /> }}
          pagination={{ pageSize: 50, showTotal: (t) => `ทั้งหมด ${t} ใบ` }} scroll={{ x: 800 }} />
      </Card>

      <Modal open={!!preview} onCancel={() => setPreview(null)} footer={null} width={1000} style={{ top: 20 }}
        title={preview ? `ต้นฉบับใบ ${preview.doc_no} · หน้า ${preview.page}` : ""}>
        {pdfUrl ? (
          <iframe key={`${preview?.doc_no}-${preview?.page}`} title="pdf" src={`${pdfUrl}#page=${preview?.page || 1}&zoom=page-width`}
            style={{ width: "100%", height: "78vh", border: "1px solid #eee", borderRadius: 8 }} />
        ) : <Flex justify="center" style={{ padding: 60 }}><Typography.Text type="secondary">กำลังโหลดไฟล์…</Typography.Text></Flex>}
      </Modal>

      <Modal open={!!editRow} title={editRow ? `แก้ไขยอดใบ ${editRow.doc_no}` : ""} okText="บันทึก" cancelText="ยกเลิก"
        onCancel={() => setEditRow(null)}
        onOk={async () => {
          try {
            await api.post(URL, { action: "update", id: editRow.id, total: editVal }, { ignoreLoading: true });
            message.success("แก้ไขยอดแล้ว");
            setEditRow(null);
            loadList();
          } catch (e) { message.error(errMsg(e, "แก้ไขไม่สำเร็จ")); }
        }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 6 }}>ยอดสุทธิ (แก้ได้เฉพาะใบที่ยังไม่วางบิล)</Typography.Text>
        <InputNumber value={editVal} min={0} precision={2} style={{ width: "100%", height: 38 }} onChange={(v) => setEditVal(Number(v || 0))}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(v) => (v || "").replace(/,/g, "")} />
      </Modal>
    </Flex>
  );
}
