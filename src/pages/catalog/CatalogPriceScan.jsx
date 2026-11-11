/* ============================================================================
   Scan ราคาจากไฟล์ (AI) — ใช้ในหน้า Duplicate แคตตาล็อกเท่านั้น
   อ่านไฟล์ราคา .xlsx (หลายไฟล์ได้) ด้วย api/ai/catalog-import.php ตัวเดียวกับหน้านำเข้า
   แล้วเทียบกับรายการในแคตตาล็อกที่กำลังแก้ แบ่ง 4 List ให้ผู้ใช้ยืนยัน:
     1) ราคาไม่ตรง            -> ติ๊ก = ใช้ราคาใหม่ (ติ๊กไว้ให้ก่อน) แก้ตัวเลขได้
     2) มีในไฟล์ ไม่มีในแคตตาล็อก -> ติ๊ก = เพิ่มเข้าแคตตาล็อก (ไม่ติ๊กไว้ให้)
     3) จับคู่ไม่เจอ            -> เลือกสินค้าเองได้ ที่เหลือเข้าแท็บ "รอสร้างสินค้า"
     4) มีในแคตตาล็อก ไม่มีในไฟล์ -> แสดงเฉยๆ ติ๊ก = ลบออก
   กด "นำไปใช้" แก้ตารางบนหน้าจอเท่านั้น ผู้ใช้ต้องกด Save ที่หน้าแคตตาล็อกอีกครั้ง
   ============================================================================ */
import React, { useMemo, useState } from "react";
import {
  Alert, Button, Checkbox, Flex, InputNumber, Modal, Select, Space, Spin, Table, Tabs, Tag, Typography, Upload, message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { requestService as api } from "../../service/Request.service";

const URL_IMPORT = `/ai/catalog-import.php`;
const money = (v) => (v == null || v === "" ? "-" : Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const sameUnit = (a, b) => !a || !b || String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

export default function CatalogPriceScan({ open, onClose, listDetail = [], onApply }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [errors, setErrors] = useState([]);
  const [lines, setLines] = useState(null); // ผลจาก AI ทุกไฟล์รวมกัน
  const [items, setItems] = useState([]);
  /* การตัดสินใจของผู้ใช้ */
  const [diffPick, setDiffPick] = useState({}); // stcode -> { use, price }
  const [newPick, setNewPick] = useState({}); // stcode -> { use, price }
  const [unmatchedPick, setUnmatchedPick] = useState({}); // idx -> stcode
  const [removePick, setRemovePick] = useState({}); // stcode -> bool

  const reset = () => {
    setQueue([]); setLines(null); setItems([]); setErrors([]);
    setDiffPick({}); setNewPick({}); setUnmatchedPick({}); setRemovePick({});
  };
  const close = () => { if (!loading) { reset(); onClose(); } };

  const itemMap = useMemo(() => Object.fromEntries(items.map((i) => [i.stcode, i])), [items]);
  const itemOptions = useMemo(() => items.map((i) => ({ value: i.stcode, label: `${i.stname} (${i.stcode})` })), [items]);
  const catMap = useMemo(() => Object.fromEntries(listDetail.map((d) => [d.stcode, d])), [listDetail]);

  /* อ่านทีละไฟล์ แล้วรวมผล */
  const run = async (files) => {
    setLoading(true);
    setErrors([]);
    const all = [];
    let lastItems = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({ i: i + 1, n: files.length, name: files[i].name });
      try {
        const fd = new FormData();
        fd.append("file", files[i]);
        const res = await api.post(URL_IMPORT, fd, { ignoreLoading: true, timeout: 900000 });
        const d = res?.data?.data;
        lastItems = d?.items || lastItems;
        (d?.lines || []).forEach((l) => all.push({ ...l, file: files[i].name, idx: all.length }));
      } catch (err) {
        setErrors((s) => [...s, `${files[i].name}: ${err?.response?.data?.message || err?.message || "อ่านไฟล์ไม่สำเร็จ"}`]);
      }
    }
    setItems(lastItems);
    setLines(all);
    setProgress(null);
    setLoading(false);
  };

  const askStart = () => {
    const files = [...queue];
    if (!files.length) return;
    Modal.confirm({
      title: `เริ่มอ่าน ${files.length} ไฟล์ด้วย AI?`,
      content: <>{files.map((f) => <div key={f.uid || f.name}>• {f.name}</div>)}
        <div style={{ color: "#8c8c8c", marginTop: 6 }}>ใช้เวลาไฟล์ละประมาณ 2-5 นาที และมีค่าใช้จ่าย AI</div></>,
      okText: "เริ่มอ่านไฟล์", cancelText: "ยังไม่เริ่ม",
      onOk: () => { setQueue([]); run(files); },
    });
  };

  /* แบ่ง 4 List (สินค้าเดียวกันหลายแถวในไฟล์ ใช้แถวแรก) */
  const result = useMemo(() => {
    if (!lines) return null;
    const firstByCode = {};
    const dupNote = {};
    const unmatched = [];
    lines.forEach((l) => {
      const code = unmatchedPick[l.idx] || l.stcode;
      if (!code) { unmatched.push(l); return; }
      if (firstByCode[code]) {
        if (l.price != null && Number(l.price) !== Number(firstByCode[code].price)) dupNote[code] = true;
        return;
      }
      firstByCode[code] = { ...l, stcode: code };
    });
    /* แถวที่ผู้ใช้เลือกสินค้าให้แล้วใน List 3 ยังโชว์ใน List 3 (ให้แก้ได้) แต่ถูกนับเข้า List 1/2 ด้วย */
    const picked = lines.filter((l) => !l.stcode && unmatchedPick[l.idx]);
    const diff = [], same = [], added = [];
    Object.values(firstByCode).forEach((l) => {
      const cur = catMap[l.stcode];
      if (cur) {
        if (l.price == null) return; // ไฟล์ไม่มีราคา -> ไม่เทียบ
        if (Number(l.price) === Number(cur.price)) same.push(l);
        else diff.push({ ...l, oldPrice: Number(cur.price || 0) });
      } else {
        added.push(l);
      }
    });
    const missing = listDetail.filter((d) => !firstByCode[d.stcode]);
    return { diff, same, added, unmatched: [...unmatched, ...picked], missing, dupNote };
  }, [lines, unmatchedPick, catMap, listDetail]);

  /* ค่าเริ่มต้น: ราคาไม่ตรง = ติ๊ก, เพิ่มใหม่ = ไม่ติ๊ก */
  const diffState = (l) => diffPick[l.stcode] ?? { use: true, price: Number(l.price) };
  const newState = (l) => newPick[l.stcode] ?? { use: false, price: l.price != null ? Number(l.price) : null };

  const apply = () => {
    const { diff, added, unmatched, missing } = result;
    const priceUpdates = {};
    diff.forEach((l) => { const s = diffState(l); if (s.use && s.price != null) priceUpdates[l.stcode] = Number(s.price); });
    const additions = [];
    for (const l of added) {
      const s = newState(l);
      if (!s.use) continue;
      if (s.price == null) return message.warning(`กรุณาใส่ราคาให้ ${itemMap[l.stcode]?.stname || l.name} ก่อนเพิ่มเข้าแคตตาล็อก`);
      const it = itemMap[l.stcode] || {};
      additions.push({ stcode: l.stcode, stname: it.stname || l.name, unit: it.unit || l.unit, price: Number(s.price), catalog_group_id: it.catalog_group_id ?? null });
    }
    const removals = missing.filter((d) => removePick[d.stcode]).map((d) => d.stcode);
    const pending = unmatched.filter((l) => !unmatchedPick[l.idx]).map((l) => ({
      raw_name: l.name, name_en: l.name_en, unit: l.unit, price: l.price,
      group_name: l.group, cust_code: l.code, source_file: l.file,
    }));
    onApply({ priceUpdates, additions, removals, pending });
    message.success(`แก้ราคา ${Object.keys(priceUpdates).length} · เพิ่ม ${additions.length} · ลบ ${removals.length} · รอสร้างสินค้า ${pending.length} รายการ — กด Save เพื่อบันทึก`);
    reset();
    onClose();
  };

  const nameCell = (l) => (
    <>
      {itemMap[l.stcode]?.stname || catMap[l.stcode]?.stname || l.name}
      <div style={{ color: "#8c8c8c", fontSize: 12 }}>ในไฟล์: {l.name}{l.name_en ? ` / ${l.name_en}` : ""} · {l.file}</div>
    </>
  );
  const unitWarn = (l) => {
    const sys = itemMap[l.stcode]?.unit || catMap[l.stcode]?.unit;
    return !sameUnit(l.unit, sys) ? <Tag color="orange" style={{ marginTop: 4 }}>หน่วยในไฟล์ {l.unit} / ระบบ {sys}</Tag> : null;
  };

  const tabs = result && [
    {
      key: "diff", label: <>ราคาไม่ตรง <Tag color="red">{result.diff.length}</Tag></>,
      children: (
        <Table size="small" bordered rowKey="stcode" pagination={{ pageSize: 50 }} dataSource={result.diff} scroll={{ x: "max-content" }}
          columns={[
            { title: "ใช้ราคาใหม่", width: 90, align: "center", render: (_, l) => <Checkbox checked={diffState(l).use}
                onChange={(e) => setDiffPick((s) => ({ ...s, [l.stcode]: { ...diffState(l), use: e.target.checked } }))} /> },
            { title: "สินค้า", render: (_, l) => nameCell(l) },
            { title: "ราคาเดิม", width: 100, align: "right", render: (_, l) => money(l.oldPrice) },
            { title: "ราคาในไฟล์", width: 130, render: (_, l) => (<>
                <InputNumber size="small" min={0} value={diffState(l).price} style={{ width: 110 }}
                  onChange={(v) => setDiffPick((s) => ({ ...s, [l.stcode]: { ...diffState(l), price: v } }))} />
                {unitWarn(l)}
                {result.dupNote[l.stcode] && <Tag color="gold" style={{ marginTop: 4 }}>ไฟล์มีหลายราคา ใช้แถวแรก</Tag>}
              </>) },
            { title: "ส่วนต่าง", width: 110, align: "right", render: (_, l) => {
                const d = Number(diffState(l).price || 0) - l.oldPrice;
                return <span style={{ color: d > 0 ? "#cf1322" : "#389e0d" }}>{d > 0 ? "+" : ""}{money(d)}</span>;
              } },
          ]} />
      ),
    },
    {
      key: "new", label: <>มีในไฟล์ ไม่มีในแคตตาล็อก <Tag color="blue">{result.added.length}</Tag></>,
      children: (
        <Table size="small" bordered rowKey="stcode" pagination={{ pageSize: 50 }} dataSource={result.added} scroll={{ x: "max-content" }}
          columns={[
            { title: "เพิ่มเข้า", width: 80, align: "center", render: (_, l) => <Checkbox checked={newState(l).use}
                onChange={(e) => setNewPick((s) => ({ ...s, [l.stcode]: { ...newState(l), use: e.target.checked } }))} /> },
            { title: "สินค้า", render: (_, l) => nameCell(l) },
            { title: "ราคาในไฟล์", width: 130, render: (_, l) => (<>
                <InputNumber size="small" min={0} value={newState(l).price} style={{ width: 110 }} placeholder="ใส่ราคา"
                  onChange={(v) => setNewPick((s) => ({ ...s, [l.stcode]: { ...newState(l), price: v } }))} />
                {unitWarn(l)}
              </>) },
          ]} />
      ),
    },
    {
      key: "unmatched", label: <>จับคู่ไม่เจอ <Tag color="gold">{result.unmatched.length}</Tag></>,
      children: (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">เลือกสินค้าให้ได้ถ้ามีในระบบ (จะไปอยู่ List ราคาไม่ตรง/เพิ่มใหม่) ตัวที่ไม่ได้เลือกจะเข้าแท็บ "รอสร้างสินค้า" ของแคตตาล็อก</Typography.Text>
          <Table size="small" bordered rowKey="idx" pagination={{ pageSize: 50 }} dataSource={result.unmatched} scroll={{ x: "max-content" }}
            columns={[
              { title: "ชื่อในไฟล์", render: (_, l) => <>{l.name}{l.name_en && <div style={{ color: "#8c8c8c", fontSize: 12 }}>{l.name_en}</div>}</> },
              { title: "หน่วย", dataIndex: "unit", width: 70 },
              { title: "ราคา", width: 90, align: "right", render: (_, l) => money(l.price) },
              { title: "ไฟล์", dataIndex: "file", width: 160 },
              { title: "จับคู่กับสินค้า", width: 300, render: (_, l) => (
                  <Select size="small" showSearch allowClear style={{ width: "100%" }} placeholder="ไม่มีในระบบ (รอสร้างสินค้า)"
                    options={itemOptions} optionFilterProp="label" value={unmatchedPick[l.idx]}
                    onChange={(v) => setUnmatchedPick((s) => ({ ...s, [l.idx]: v || undefined }))} />
                ) },
            ]} />
        </Space>
      ),
    },
    {
      key: "missing", label: <>มีในแคตตาล็อก ไม่มีในไฟล์ <Tag>{result.missing.length}</Tag></>,
      children: (
        <Table size="small" bordered rowKey="stcode" pagination={{ pageSize: 50 }} dataSource={result.missing}
          columns={[
            { title: "ลบออก", width: 70, align: "center", render: (_, d) => <Checkbox checked={!!removePick[d.stcode]}
                onChange={(e) => setRemovePick((s) => ({ ...s, [d.stcode]: e.target.checked }))} /> },
            { title: "สินค้า", render: (_, d) => <>{d.stname} <span style={{ color: "#8c8c8c" }}>({d.stcode})</span></> },
            { title: "ราคาเดิม (คงไว้)", width: 130, align: "right", render: (_, d) => money(d.price) },
          ]} />
      ),
    },
  ];

  return (
    <Modal open={open} onCancel={close} width={1100} style={{ top: 20 }} maskClosable={false}
      title="Scan ราคาจากไฟล์ (AI) — เทียบกับแคตตาล็อกนี้"
      footer={result ? [
        <Button key="c" onClick={close}>ยกเลิก</Button>,
        <Button key="a" type="primary" onClick={apply}>นำไปใช้</Button>,
      ] : [<Button key="c" onClick={close} disabled={loading}>ปิด</Button>]}>
      <Spin spinning={loading} tip={progress ? `AI กำลังอ่านไฟล์ ${progress.i}/${progress.n}: ${progress.name}` : ""}>
        {!result && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Upload.Dragger multiple showUploadList={false} disabled={loading}
              beforeUpload={(f) => {
                const nm = (f.name || "").toLowerCase();
                if (nm.endsWith(".xls")) { message.warning(`${f.name}: ไฟล์ .xls รุ่นเก่า กรุณา Save As เป็น .xlsx`); return false; }
                if (!nm.endsWith(".xlsx")) { message.warning(`${f.name}: รองรับเฉพาะไฟล์ .xlsx`); return false; }
                setQueue((q) => (q.some((x) => x.name === f.name && x.size === f.size) ? q : [...q, f]));
                return false;
              }}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">คลิกหรือลากไฟล์ราคา .xlsx มาวาง (เลือกได้หลายไฟล์)</p>
              <p className="ant-upload-hint">เทียบเฉพาะราคากับแคตตาล็อกนี้ {listDetail.length} รายการ</p>
            </Upload.Dragger>
            {queue.length > 0 && (
              <Flex vertical gap={6}>
                {queue.map((f) => (
                  <Flex key={f.uid || f.name} justify="space-between">
                    <Typography.Text>{f.name}</Typography.Text>
                    <Button size="small" danger onClick={() => setQueue((q) => q.filter((x) => x !== f))}>เอาออก</Button>
                  </Flex>
                ))}
                <Button type="primary" onClick={askStart} disabled={loading}>เริ่มอ่าน {queue.length} ไฟล์ด้วย AI</Button>
              </Flex>
            )}
          </Space>
        )}
        {errors.map((e, i) => <Alert key={i} type="error" showIcon message={e} style={{ marginTop: 8 }} />)}
        {result && (
          <>
            <Alert type="info" showIcon style={{ marginBottom: 8 }}
              message={`ราคาตรงกัน ${result.same.length} · ราคาไม่ตรง ${result.diff.length} · มีในไฟล์แต่ไม่มีในแคตตาล็อก ${result.added.length} · จับคู่ไม่เจอ ${result.unmatched.length} · มีในแคตตาล็อกแต่ไม่มีในไฟล์ ${result.missing.length}`}
              description='กด "นำไปใช้" แก้ตารางบนหน้าจอเท่านั้น ต้องกด Save ที่หน้าแคตตาล็อกอีกครั้งจึงบันทึก' />
            <Tabs items={tabs} />
          </>
        )}
      </Spin>
    </Modal>
  );
}
