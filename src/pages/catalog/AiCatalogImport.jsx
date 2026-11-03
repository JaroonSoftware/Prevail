/* ============================================================================
   นำเข้าไฟล์ราคา Excel -> แคตตาล็อก ด้วย AI
   * เลือกได้หลายไฟล์ รวมเป็นแคตตาล็อกเดียว (อ่านทีละไฟล์ตามลำดับ)
   * รายการที่ยังไม่มีสินค้าในระบบ เก็บไว้ในแคตตาล็อกแท็บ "รอสร้างสินค้า"
   1) อัปโหลด .xlsx  2) AI อ่านชื่อ/หน่วย/ราคา/หมวด แล้วจับคู่สินค้าในระบบ
   3) ผู้ใช้ตรวจ/แก้การจับคู่ ราคา และเลือกรายการที่จะเอา
   4) กด "สร้างแคตตาล็อก" -> ไปหน้าสร้างแคตตาล็อกเดิม (แท็บตามหมวด) พร้อมข้อมูล
      เลือกลูกค้า ตรวจอีกครั้ง แล้วกด Save ที่หน้านั้น
   ============================================================================ */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Button, Card, Checkbox, DatePicker, Flex, Input, InputNumber, Segmented,
  Modal, Select, Space, Spin, Table, Tag, Typography, Upload, message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { requestService as api } from "../../service/Request.service";
import { ButtonBack } from "../../components/button";

const URL_IMPORT = `/ai/catalog-import.php`;

const levelTag = (l) =>
  !l.stcode ? <Tag color="red">ไม่พบสินค้า</Tag>
  : l.level === "high" ? <Tag color="green">ตรง</Tag>
  : <Tag color="orange">ตรวจ</Tag>;

function AiCatalogImport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /* ไฟล์ที่เลือกไว้ ยังไม่ส่งให้ AI จนกว่าจะกดยืนยัน */
  const [queue, setQueue] = useState([]);
  const [progress, setProgress] = useState(null); // { done, total, name }
  const [fileErrors, setFileErrors] = useState([]);
  const [readFiles, setReadFiles] = useState([]);
  const [data, setData] = useState(null);
  const [lines, setLines] = useState([]);
  const [name, setName] = useState("");
  const [range, setRange] = useState(null);
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");

  const itemMap = useMemo(() => Object.fromEntries((data?.items || []).map((i) => [i.stcode, i])), [data]);
  const itemOptions = useMemo(
    () => (data?.items || []).map((i) => ({
      value: i.stcode,
      label: `${i.stname}${i.stnameEN ? ` / ${i.stnameEN}` : ""} (${i.stcode})`,
    })),
    [data]
  );

  /* อ่านทีละไฟล์ ต่อท้ายผลเดิม (เพิ่มไฟล์ทีหลังได้) */
  const runFiles = async (files) => {
    setLoading(true);
    setError(null);
    let nextIdx = lines.reduce((m, l) => Math.max(m, l.idx + 1), 0);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ done: i, total: files.length, name: file.name });
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post(URL_IMPORT, fd, { ignoreLoading: true, timeout: 900000 });
        const d = res?.data?.data;
        const base = nextIdx;
        nextIdx += (d?.lines || []).length;
        setData((old) => ({ ...(old || {}), ...d, mock: (old?.mock || false) || d?.mock }));
        setLines((old) => [
          ...old,
          ...(d?.lines || []).map((l, k) => ({
            ...l,
            idx: base + k,
            file: file.name,
            orig: l.stcode,
            /* จับคู่ได้มั่นใจ+มีราคา -> ลงแคตตาล็อก / จับคู่ไม่ได้ -> เก็บไว้รอสร้างสินค้า */
            use: l.stcode ? l.price != null && l.level === "high" : true,
          })),
        ]);
        setName((n) => n || d?.meta?.title || file.name.replace(/\.xlsx$/i, ""));
        setRange((rg) => rg || (d?.meta?.start_date && d?.meta?.stop_date ? [dayjs(d.meta.start_date), dayjs(d.meta.stop_date)] : null));
        setReadFiles((s) => [...s, file.name]);
      } catch (err) {
        setFileErrors((s) => [...s, `${file.name}: ${err?.response?.data?.message || err?.message || "อ่านไฟล์ไม่สำเร็จ"}`]);
      }
    }
    setProgress(null);
    setLoading(false);
  };

  /* วางไฟล์แล้วยังไม่เริ่ม — ถามยืนยันก่อน (AI มีค่าใช้จ่ายและใช้เวลาหลายนาที) */
  const askStart = () => {
    if (!queue.length) return;
    const files = [...queue];
    Modal.confirm({
      title: `เริ่มอ่าน ${files.length} ไฟล์ด้วย AI?`,
      content: (
        <>
          {files.map((f) => <div key={f.uid || f.name}>• {f.name}</div>)}
          <div style={{ color: "#8c8c8c", marginTop: 6 }}>รวมเป็นแคตตาล็อกเดียว ใช้เวลาไฟล์ละประมาณ 2-5 นาที และมีค่าใช้จ่าย AI ตามขนาดไฟล์</div>
        </>
      ),
      okText: "เริ่มอ่านไฟล์",
      cancelText: "ยังไม่เริ่ม",
      onOk: () => { setQueue([]); runFiles(files); },
    });
  };

  const patch = (idx, p) => setLines((s) => s.map((l) => (l.idx === idx ? { ...l, ...p } : l)));

  /* รหัสสินค้าเดียวกันลงแคตตาล็อกได้ครั้งเดียว — แถวหลังที่ซ้ำแจ้งเตือน */
  const dupSet = useMemo(() => {
    const seen = new Set();
    const dup = new Set();
    lines.filter((l) => l.use && l.stcode).forEach((l) => (seen.has(l.stcode) ? dup.add(l.idx) : seen.add(l.stcode)));
    return dup;
  }, [lines]);

  const counts = useMemo(() => ({
    all: lines.length,
    check: lines.filter((l) => l.stcode && l.level !== "high").length,
    none: lines.filter((l) => !l.stcode).length,
    keep: lines.filter((l) => !l.stcode && l.use).length,
    noprice: lines.filter((l) => l.price == null).length,
    use: lines.filter((l) => l.use && l.stcode).length,
  }), [lines]);

  const shown = lines.filter((l) =>
    (view === "all" || (view === "check" && l.stcode && l.level !== "high") || (view === "none" && !l.stcode)
      || (view === "noprice" && l.price == null) || (view === "use" && l.use && l.stcode))
    && (!search || l.name?.includes(search) || l.name_en?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    const chosen = lines.filter((l) => l.use && l.stcode && !dupSet.has(l.idx));
    /* ยังไม่มีสินค้าในระบบ -> แท็บ "รอสร้างสินค้า" (ชื่อ+หน่วยซ้ำกันข้ามไฟล์ เก็บแถวแรก) */
    const seenP = new Set();
    const pendingRows = lines.filter((l) => l.use && !l.stcode).filter((l) => {
      const k = `${(l.name || "").replace(/\s+/g, "")}|${(l.unit || "").toLowerCase()}`;
      if (seenP.has(k)) return false;
      seenP.add(k);
      return true;
    });
    if (!chosen.length && !pendingRows.length) return message.warning("ยังไม่ได้เลือกรายการที่จะนำเข้า");
    if (chosen.some((l) => l.price == null)) return message.warning("มีรายการที่เลือกแต่ยังไม่มีราคา");

    /* จำชื่อในไฟล์ที่ผู้ใช้แก้/ยืนยัน + ตั้งหมวดให้สินค้าที่ยังไม่มีหมวด (ไม่สำเร็จก็ไปต่อได้) */
    try {
      await api.post(URL_IMPORT, {
        action: "learn",
        aliases: chosen.filter((l) => l.level !== "high" || l.stcode !== l.orig).map((l) => ({ raw_text: l.name, stcode: l.stcode })),
        groups: chosen.filter((l) => l.group).map((l) => ({ stcode: l.stcode, group: l.group })),
      }, { ignoreLoading: true });
    } catch (e) { /* ignore */ }

    const groupIdByName = Object.fromEntries((data?.groups || []).map((g) => [g.group_name, g.group_id]));
    const detail = chosen.map((l) => ({
      stcode: l.stcode,
      stname: itemMap[l.stcode]?.stname,
      unit: itemMap[l.stcode]?.unit,
      price: Number(l.price),
      catalog_group_id: itemMap[l.stcode]?.catalog_group_id ?? groupIdByName[l.group] ?? null,
    }));
    navigate("/catalog/manage/create", {
      state: {
        config: { title: "สร้างแคตตาล๊อก (นำเข้าจาก Excel)", textOk: null, textCancel: null, action: "create", code: null },
        prefill: {
          catalog_name: name,
          start_date: range?.[0] ? range[0].format("YYYY-MM-DD") : null,
          stop_date: range?.[1] ? range[1].format("YYYY-MM-DD") : null,
          detail,
          pending: pendingRows.map((l) => ({
            raw_name: l.name, name_en: l.name_en, unit: l.unit, price: l.price,
            group_name: l.group, cust_code: l.code, source_file: l.file,
          })),
        },
      },
    });
  };

  const columns = [
    { title: "ใช้", key: "use", width: 50, align: "center",
      render: (_, l) => <Checkbox checked={l.use} onChange={(e) => patch(l.idx, { use: e.target.checked })} /> },
    { title: "ไฟล์ / แถว", key: "row", width: 150,
      render: (_, l) => <span style={{ fontSize: 12 }}>{l.file}<br />R{l.row}</span> },
    { title: "หมวดในไฟล์", dataIndex: "group", width: 140 },
    { title: "ชื่อในไฟล์", key: "name",
      render: (_, l) => <>{l.name}{l.name_en && <div style={{ color: "#8c8c8c", fontSize: 12 }}>{l.name_en}</div>}</> },
    { title: "หน่วย", dataIndex: "unit", width: 70 },
    { title: "ราคา", key: "price", width: 110,
      render: (_, l) => <InputNumber size="small" min={0} value={l.price} style={{ width: 95 }}
        onChange={(v) => patch(l.idx, { price: v })} /> },
    { title: "สินค้าในระบบ", key: "stcode", width: 330,
      render: (_, l) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Select size="small" showSearch allowClear style={{ width: "100%" }} placeholder="เลือกสินค้า"
            value={l.stcode || undefined} options={itemOptions} optionFilterProp="label"
            onChange={(v) => patch(l.idx, { stcode: v || null, level: v ? "user" : "low", use: v ? l.price != null : true })} />
          {dupSet.has(l.idx) && <Typography.Text type="danger" style={{ fontSize: 12 }}>ซ้ำกับแถวก่อนหน้า (จะไม่นำเข้า)</Typography.Text>}
          {l.stcode && itemMap[l.stcode]?.unit && l.unit && itemMap[l.stcode].unit.toLowerCase() !== l.unit.toLowerCase() && (
            <Typography.Text type="warning" style={{ fontSize: 12 }}>หน่วยในระบบ: {itemMap[l.stcode].unit}</Typography.Text>
          )}
        </Space>
      ) },
    { title: "สถานะ", key: "lv", width: 120,
      render: (_, l) => (!l.stcode && l.use ? <Tag color="gold">รอสร้างสินค้า</Tag>
        : l.level === "user" ? <Tag color="blue">เลือกเอง</Tag> : levelTag(l)) },
  ];

  return (
    <div style={{ padding: 8 }}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} className="m-0 !text-zinc-800">นำเข้าแคตตาล็อกจาก Excel (AI)</Typography.Title>
          <ButtonBack target="/catalog" />
        </Flex>

        <Alert type="info" showIcon
          message="อัปโหลดไฟล์ราคา .xlsx (เช่น Q4 หรือ Market List ของลูกค้า) — AI อ่านชื่อ หน่วย ราคา หมวด แล้วจับคู่สินค้าในระบบให้"
          description="ตรวจรายการที่ขึ้น “ตรวจ” / “ไม่พบสินค้า” แล้วกด “สร้างแคตตาล็อก” ระบบจะพาไปหน้าสร้างแคตตาล็อก ให้เลือกลูกค้าและกด Save อีกครั้ง (ยังไม่บันทึกจนกว่าจะกด Save)" />

        <Spin spinning={loading} tip={progress ? `AI กำลังอ่านไฟล์ ${progress.done + 1}/${progress.total}: ${progress.name}` : "กำลังทำงาน..."}>
          <Upload.Dragger accept=".xlsx" multiple showUploadList={false} disabled={loading}
            beforeUpload={(f) => {
              setQueue((q) => (q.some((x) => x.name === f.name && x.size === f.size) ? q : [...q, f]));
              return false;
            }}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">คลิกหรือลากไฟล์ .xlsx มาวาง (เลือกได้หลายไฟล์ รวมเป็นแคตตาล็อกเดียว)</p>
            {readFiles.length > 0 && <p className="ant-upload-hint">อ่านแล้ว: {readFiles.join(", ")} — เพิ่มไฟล์อีกได้ ผลจะต่อท้าย</p>}
          </Upload.Dragger>
          {queue.length > 0 && (
            <Card size="small" style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {queue.map((f) => (
                  <Flex key={f.uid || f.name} justify="space-between" align="center">
                    <Typography.Text>{f.name}</Typography.Text>
                    <Button size="small" danger onClick={() => setQueue((q) => q.filter((x) => x !== f))}>เอาออก</Button>
                  </Flex>
                ))}
                <Flex gap={8}>
                  <Button type="primary" disabled={loading} onClick={askStart}>เริ่มอ่าน {queue.length} ไฟล์ด้วย AI</Button>
                  <Button disabled={loading} onClick={() => setQueue([])}>ล้างรายการ</Button>
                </Flex>
              </Space>
            </Card>
          )}
        </Spin>

        {fileErrors.map((e, i) => <Alert key={i} type="error" showIcon message={e} closable />)}
        {error && <Alert type="error" showIcon message={error} />}

        {data && (
          <Card size="small"
            title={<Space wrap>
              <span>ผลการอ่าน {counts.all} รายการ</span>
              {data.mock && <Tag color="purple">โหมดจำลอง</Tag>}
              <Tag color="green">ลงแคตตาล็อก {counts.use}</Tag>
              <Tag color="gold">รอสร้างสินค้า {counts.keep}</Tag>
            </Space>}
            extra={<Button type="primary" onClick={handleCreate}>สร้างแคตตาล็อก →</Button>}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Flex gap={8} wrap="wrap">
                <Input style={{ maxWidth: 360 }} value={name} onChange={(e) => setName(e.target.value)} addonBefore="ชื่อแคตตาล็อก" />
                <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" />
              </Flex>
              <Flex gap={8} wrap="wrap" align="center">
                <Segmented value={view} onChange={setView} options={[
                  { value: "all", label: `ทั้งหมด ${counts.all}` },
                  { value: "check", label: `ต้องตรวจ ${counts.check}` },
                  { value: "none", label: `ไม่พบสินค้า (รอสร้าง) ${counts.none}` },
                  { value: "noprice", label: `ไม่มีราคา ${counts.noprice}` },
                  { value: "use", label: `เลือกแล้ว ${counts.use}` },
                ]} />
                <Input allowClear placeholder="ค้นหาชื่อในไฟล์" style={{ maxWidth: 240 }} value={search} onChange={(e) => setSearch(e.target.value)} />
              </Flex>
              <Table size="small" bordered rowKey="idx" columns={columns} dataSource={shown}
                pagination={{ defaultPageSize: 50, pageSizeOptions: [50, 100, 200] }} scroll={{ x: "max-content" }} />
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}

export default AiCatalogImport;
