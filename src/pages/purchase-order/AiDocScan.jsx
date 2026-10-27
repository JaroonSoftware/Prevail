/* eslint-disable react-hooks/exhaustive-deps */
/* ============================================================================
   ใบสั่งซื้ออ่านค่าจาก AI (ทดสอบ)   เมนู BUY > /ai-purchase-order

   1) ถ่ายรูป/เลือกไฟล์ บิล ใบส่งของ ใบกำกับภาษี → ระบบย่อรูปแล้วส่งให้ AI อ่าน
   2) เทียบรูปกับสิ่งที่อ่านได้ แก้ผู้ขาย/สินค้า/จำนวน/ราคาได้ทุกช่อง
   3) กด "สร้างใบสั่งซื้อ" → ไปหน้าสร้างใบสั่งซื้อเดิม พร้อมข้อมูลที่เติมไว้แล้ว
      หน้านี้ไม่บันทึกอะไร — ใบสั่งซื้อของ Prevail ตัดเข้าสต๊อกทันทีที่กดบันทึก
      ผู้ใช้จึงต้องตรวจและกดบันทึกที่หน้าใบสั่งซื้อเอง
   ============================================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Flex,
  Image,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import { InboxOutlined, ReloadOutlined, SwapOutlined } from "@ant-design/icons";
import { TbSquareRoundedCheck } from "react-icons/tb";
import dayjs from "dayjs";

import AiDocScanService from "../../service/AiDocScan.service";
import ModalSupplier from "../../components/modal/supplier/ModalSupplier";
import { ButtonBack } from "../../components/button";
import { formatMoney } from "../../utils/util";

const svc = AiDocScanService();
const gotoFrom = "/purchase-order";
const PO_CREATE = "/purchase-order/manage/create";
const dateFormat = "DD/MM/YYYY";
const MAX_SIDE = 2000;

/* ---------------------------------------------------------------- helpers */

const num = (v, d = 2) => formatMoney(Number(v || 0), d);
const round = (v, d = 2) => Math.round(Number(v || 0) * 10 ** d) / 10 ** d;

/* หน่วยกลาง ให้ตรงกับฝั่ง PHP (AiText::unit) */
const UNITS = {
  kg: ["kg", "kgs", "กก", "กิโลกรัม", "กิโล", "kilogram", "kilograms"],
  g: ["g", "gm", "gram", "grams", "กรัม", "ก"],
  ton: ["ton", "tons", "ตัน", "mt"],
  l: ["l", "lt", "ltr", "litre", "liter", "ลิตร", "ล"],
  ml: ["ml", "มล", "มิลลิลิตร", "cc", "ซีซี"],
  bag: ["bag", "bags", "ถุง", "กระสอบ", "sack", "sacks"],
  box: ["box", "boxes", "กล่อง"],
  carton: ["carton", "cartons", "ctn", "ctns", "ลัง"],
  bottle: ["bottle", "bottles", "btl", "ขวด"],
  can: ["can", "cans", "กระป๋อง"],
  drum: ["drum", "drums", "ถัง", "แกลลอน", "gallon", "pail", "pails"],
  pcs: ["pc", "pcs", "piece", "pieces", "ea", "each", "ชิ้น", "อัน", "unit", "units"],
  roll: ["roll", "rolls", "ม้วน"],
  pack: ["pack", "packs", "pk", "แพ็ค", "แพค", "แพ็ก", "ห่อ"],
  set: ["set", "sets", "ชุด"],
  sheet: ["sheet", "sheets", "แผ่น"],
  m: ["m", "meter", "metre", "เมตร"],
};
const normText = (s) => String(s || "").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
const unitKey = (u) => {
  const n = normText(u);
  if (!n) return "";
  for (const [k, alts] of Object.entries(UNITS)) if (alts.some((a) => normText(a) === n)) return k;
  return n;
};

/* ย่อรูปในเครื่องก่อนส่ง: ด้านยาวไม่เกิน 2000px, JPG 85% — ส่งเร็ว ประหยัดค่า AI */
function loadViaImg(raw) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(raw);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("เบราว์เซอร์เปิดรูปนี้ไม่ได้ — ถ้าเป็นไฟล์ HEIC จาก iPhone ให้ส่งเป็น JPG"));
    };
    img.src = url;
  });
}

async function prepareFile(raw) {
  const isPdf = raw.type === "application/pdf" || /\.pdf$/i.test(raw.name);
  if (isPdf) return { file: raw, pdf: true };
  if (!raw.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(raw.name)) {
    throw new Error("รองรับเฉพาะรูปภาพ หรือไฟล์ PDF");
  }
  let bmp;
  try {
    bmp = await createImageBitmap(raw, { imageOrientation: "from-image" });
  } catch (e) {
    bmp = await loadViaImg(raw);
  }
  const bw = bmp.width || bmp.naturalWidth;
  const bh = bmp.height || bmp.naturalHeight;
  const scale = Math.min(1, MAX_SIDE / Math.max(bw, bh));
  const w = Math.max(1, Math.round(bw * scale));
  const h = Math.max(1, Math.round(bh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("แปลงรูปไม่สำเร็จ ลองเลือกไฟล์ใหม่");
  const name = (raw.name || "scan").replace(/\.[^.]+$/, "") + ".jpg";
  return { file: new File([blob], name, { type: "image/jpeg" }), pdf: false };
}

const SUPPLIER_SOURCE = {
  tax_id: { color: "success", text: "เลขผู้เสียภาษีตรงกัน" },
  alias: { color: "success", text: "เคยยืนยันชื่อนี้แล้ว" },
  name: { color: "warning", text: "ชื่อใกล้เคียง" },
  manual: { color: "blue", text: "เลือกเอง" },
};

/* ยอดสุทธิของแถว แบบเดียวกับฟอร์มใบสั่งซื้อ (ส่วนลดเป็น %) ยังไม่รวม VAT */
const lineNet = (r) => Number(r.qty || 0) * Number(r.price || 0) * (1 - Number(r.discount || 0) / 100);

/* ================================================================== page */

function PurchaseOrderAiScan() {
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);

  const [result, setResult] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [supplierSource, setSupplierSource] = useState(null);
  const [docNo, setDocNo] = useState("");
  const [buyDate, setBuyDate] = useState(dayjs());
  const [rows, setRows] = useState([]);
  const [openSupplier, setOpenSupplier] = useState(false);

  const timerRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const itemMap = useMemo(
    () => new Map((result?.items || []).map((it) => [String(it.stcode), it])),
    [result]
  );

  /* สินค้าเดียวกันหลายแถว → ฟอร์มใบสั่งซื้อรับได้สินค้าละ 1 บรรทัด จะรวมให้ */
  const groupCount = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      if (!r.include || !r.chosen) return;
      m.set(r.chosen, (m.get(r.chosen) || 0) + 1);
    });
    return m;
  }, [rows]);

  /* ---------------------------------------------------------- actions */

  const startTimer = (text) => {
    setBusy(true);
    setBusyText(text);
    setElapsed(0);
    const t0 = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 500);
  };
  const stopTimer = () => {
    clearInterval(timerRef.current);
    setBusy(false);
  };

  /* ราคาเริ่มต้น: ราคาในบิล > ราคาซื้อในทะเบียน , ส่วนลดในบิล (บาท) แปลงเป็น % */
  const initPriceDiscount = (doc, item) => {
    const price = doc?.unit_price != null ? Number(doc.unit_price) : Number(item?.buyprice || 0);
    const gross = Number(doc?.qty || 0) * price;
    const discount = doc?.discount != null && gross > 0 ? round((Number(doc.discount) / gross) * 100, 4) : 0;
    return { price, discount };
  };

  const buildRows = (data, prevRows = null) => {
    const items = new Map((data?.items || []).map((it) => [String(it.stcode), it]));
    return (data?.lines || []).map((l) => {
      const chosen = l.match?.code != null ? String(l.match.code) : null;
      const old = prevRows?.find((r) => r.key === l.index);
      const pd = initPriceDiscount(l.doc, chosen ? items.get(chosen) : null);
      return {
        key: l.index,
        doc: l.doc,
        match: l.match,
        chosen,
        include: chosen != null,
        /* เปลี่ยนผู้ขายแล้วจับคู่ใหม่ — คงจำนวน/ราคาที่ผู้ใช้แก้ไว้ */
        qty: old ? old.qty : l.doc?.qty ?? null,
        price: old ? old.price : pd.price,
        discount: old ? old.discount : pd.discount,
      };
    });
  };

  const applyResult = (data, keepEdits = false) => {
    setResult(data);
    setSupplier(data?.supplier?.matched || null);
    setSupplierSource(data?.supplier?.matched ? data?.supplier?.source : null);
    if (!keepEdits) {
      setDocNo(data?.document?.document_no || "");
      setBuyDate(data?.document?.document_date ? dayjs(data.document.document_date) : dayjs());
    }
    setRows((prev) => buildRows(data, keepEdits ? prev : null));
  };

  const handleFile = async (raw) => {
    setError(null);
    setResult(null);
    setRows([]);
    setSupplier(null);
    let prepared;
    try {
      startTimer("กำลังเตรียมรูป…");
      prepared = await prepareFile(raw);
    } catch (e) {
      stopTimer();
      setError(e?.message || "เปิดไฟล์ไม่สำเร็จ");
      return false;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = prepared.pdf ? null : URL.createObjectURL(prepared.file);
    previewRef.current = url;
    setPreview(url);
    setIsPdf(prepared.pdf);

    setBusyText("AI กำลังอ่านเอกสาร…");
    try {
      const res = await svc.scan(prepared.file);
      applyResult(res?.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "อ่านเอกสารไม่สำเร็จ");
    } finally {
      stopTimer();
    }
    return false; // ไม่ให้ Upload ของ antd ส่งไฟล์เอง
  };

  const handleSupplierPicked = async (v) => {
    if (!v?.supcode || !result?.scan_id) return;
    startTimer("กำลังจับคู่สินค้ากับผู้ขายรายนี้…");
    try {
      const res = await svc.rematch(result.scan_id, v.supcode);
      applyResult(res?.data?.data, true);
      setSupplierSource("manual");
    } catch (err) {
      message.error(err?.response?.data?.message || "จับคู่สินค้าไม่สำเร็จ");
    } finally {
      stopTimer();
    }
  };

  const updateRow = (key, patch) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  /* เลือกสินค้าใหม่: ถ้าบิลไม่มีราคา ใช้ราคาซื้อในทะเบียนของสินค้าตัวนั้น */
  const chooseItem = (row, code) => {
    const patch = { chosen: code ?? null, include: code != null };
    if (code != null && row.doc?.unit_price == null) {
      patch.price = Number(itemMap.get(code)?.buyprice || 0);
    }
    updateRow(row.key, patch);
  };

  const resetAll = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setIsPdf(false);
    setResult(null);
    setRows([]);
    setSupplier(null);
    setSupplierSource(null);
    setDocNo("");
    setBuyDate(dayjs());
    setError(null);
  };

  const readyRows = rows.filter((r) => r.include && r.chosen && Number(r.qty) > 0);
  const needCheck = rows.filter(
    (r) => r.include && r.chosen && String(r.match?.code) === r.chosen && r.match?.level !== "high"
  ).length;
  const unmatched = rows.filter((r) => !r.chosen).length;

  /* ยอดรวมแบบเดียวกับฟอร์มใบสั่งซื้อ: VAT ตามค่า vat ของสินค้าแต่ละตัว */
  const totals = readyRows.reduce(
    (a, r) => {
      const n = lineNet(r);
      const v = (n * Number(itemMap.get(r.chosen)?.vat || 0)) / 100;
      return { net: a.net + n, vat: a.vat + v, total: a.total + n + v };
    },
    { net: 0, vat: 0, total: 0 }
  );

  const handleSend = () => {
    if (!supplier) return message.warning("กรุณาเลือกผู้ขายก่อน");
    if (!readyRows.length) return message.warning("ยังไม่มีรายการที่จับคู่สินค้าและมีจำนวน");

    /* รวมแถวที่เป็นสินค้าเดียวกัน: จำนวนรวม , ราคาเฉลี่ยถ่วงน้ำหนัก , ส่วนลด % จากยอดรวม */
    const groups = new Map();
    readyRows.forEach((r) => groups.set(r.chosen, [...(groups.get(r.chosen) || []), r]));
    const items = [...groups.entries()].map(([code, g]) => {
      const it = itemMap.get(code);
      const qty = g.reduce((a, r) => a + Number(r.qty || 0), 0);
      const gross = g.reduce((a, r) => a + Number(r.qty || 0) * Number(r.price || 0), 0);
      const net = g.reduce((a, r) => a + lineNet(r), 0);
      return {
        stcode: it.stcode,
        stname: it.stname,
        buyprice: qty > 0 ? round(gross / qty, 4) : 0,
        qty: round(qty, 3),
        unit: it.unit,
        discount: gross > 0 ? round((1 - net / gross) * 100, 4) : 0,
        vat: it.vat,
      };
    });

    const remark = [
      `อ่านจากเอกสารผู้ขายด้วย AI #${result.scan_id}`,
      (docNo || "").trim() ? `เลขที่ ${(docNo || "").trim()}` : null,
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 500);

    /* จำชื่อที่ผู้ใช้ยืนยันแล้ว — ครั้งหน้าจับคู่ได้ทันที (ไม่รอผล ไม่ขวางการทำงาน) */
    const rememberSupplier = supplierSource && supplierSource !== "tax_id" && supplierSource !== "alias";
    svc
      .saveAlias({
        supcode: supplier.supcode,
        supplier_raw: rememberSupplier ? result?.document?.supplier?.name || null : null,
        items: readyRows.map((r) => ({ raw_text: r.doc?.name, stcode: r.chosen })),
      })
      .catch(() => {});

    navigate(PO_CREATE, {
      state: {
        config: { title: "สร้างใบสั่งซื้อ", textOk: null, textCancel: null, action: "create", code: null },
        aiPrefill: {
          scan_id: result.scan_id,
          supplier,
          podate: buyDate ? buyDate.format("YYYY-MM-DD") : null,
          remark,
          items,
        },
      },
    });
  };

  /* ------------------------------------------------------- render bits */

  const toOpt = (it) => ({
    value: String(it.stcode),
    label: `${it.stcode} · ${it.stname}${it.unit ? ` (${it.unit})` : ""}`,
  });

  const supplierItems = useMemo(() => (result?.items || []).filter((it) => it.sup), [result]);

  const optionsFor = (row) => {
    const rec = (row.match?.candidates || [])
      .filter((c) => c.score >= 0.3)
      .map((c) => itemMap.get(String(c.code)))
      .filter(Boolean);
    const recSet = new Set(rec.map((it) => String(it.stcode)));
    const sup = supplierItems.filter((it) => !recSet.has(String(it.stcode)));
    const supSet = new Set(sup.map((it) => String(it.stcode)));
    const rest = (result?.items || []).filter(
      (it) => !recSet.has(String(it.stcode)) && !supSet.has(String(it.stcode))
    );
    const out = [];
    if (rec.length) out.push({ label: "แนะนำจากชื่อที่อ่านได้", options: rec.map(toOpt) });
    if (sup.length) out.push({ label: "สินค้าของผู้ขายนี้", options: sup.map(toOpt) });
    if (rest.length) out.push({ label: "สินค้าทั้งหมด", options: rest.map(toOpt) });
    return out;
  };

  const MatchTag = ({ row }) => {
    if (!row.chosen) return <Tag color="error">ยังไม่จับคู่</Tag>;
    if (String(row.match?.code) !== row.chosen) return <Tag color="blue">เลือกเอง</Tag>;
    const pct = Math.round((row.match?.score || 0) * 100);
    if (row.match?.source === "alias")
      return (
        <Tooltip title="เคยยืนยันชื่อนี้กับผู้ขายรายนี้แล้ว">
          <Tag color="success">จำไว้แล้ว</Tag>
        </Tooltip>
      );
    if (row.match?.source === "ai")
      return (
        <Tooltip title={row.match?.reason || "AI จับคู่จากความหมายของชื่อ"}>
          <Tag color={row.match?.level === "high" ? "success" : "warning"}>AI จับคู่</Tag>
        </Tooltip>
      );
    if (row.match?.source === "code") return <Tag color="success">รหัสตรงกัน</Tag>;
    return row.match?.level === "high" ? (
      <Tag color="success">ตรงกัน {pct}%</Tag>
    ) : (
      <Tag color="warning">ตรวจสอบ {pct}%</Tag>
    );
  };

  const rowWarnings = (row) => {
    const w = [];
    const it = row.chosen ? itemMap.get(row.chosen) : null;
    if (!it) return w;
    if (row.doc?.unit && it.unit && unitKey(row.doc.unit) !== unitKey(it.unit)) {
      w.push(`หน่วยในบิล "${row.doc.unit}" ไม่ตรงกับสินค้า "${it.unit}" — แปลงจำนวน/ราคาให้ตรงหน่วยก่อน`);
    }
    const docAmount = row.doc?.amount;
    if (docAmount != null && Math.abs(lineNet(row) - Number(docAmount)) > 1) {
      w.push(`ยอดแถวนี้ ${num(lineNet(row))} ไม่ตรงกับในบิล ${num(docAmount)}`);
    }
    const reg = Number(it.buyprice || 0);
    if (reg > 0 && Number(row.price || 0) > 0 && Math.abs(Number(row.price) - reg) / reg > 0.3) {
      w.push(`ราคาต่างจากราคาซื้อในทะเบียน (${num(reg)}) เกิน 30%`);
    }
    return w;
  };

  const columns = [
    {
      title: "ใช้",
      dataIndex: "include",
      width: 52,
      align: "center",
      render: (_, r) => (
        <Checkbox
          checked={r.include}
          disabled={!r.chosen}
          onChange={(e) => updateRow(r.key, { include: e.target.checked })}
        />
      ),
    },
    {
      title: "ที่อ่านได้จากเอกสาร",
      dataIndex: "doc",
      width: 250,
      render: (_, r) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Typography.Text strong>{r.doc?.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.doc?.code ? `รหัสผู้ขาย ${r.doc.code} · ` : ""}
            {r.doc?.qty != null ? `${num(r.doc.qty)} ${r.doc?.unit || ""}` : "ไม่พบจำนวน"}
            {r.doc?.unit_price != null ? ` · @${num(r.doc.unit_price)}` : ""}
            {r.doc?.amount != null ? ` · รวม ${num(r.doc.amount)}` : ""}
            {r.doc?.discount != null ? ` · ลด ${num(r.doc.discount)}` : ""}
          </Typography.Text>
          {r.doc?.confidence === "low" && <Tag color="orange">อ่านไม่ชัด ตรวจกับรูป</Tag>}
        </Space>
      ),
    },
    {
      title: "สินค้าในระบบ",
      dataIndex: "chosen",
      width: 330,
      render: (_, r) => (
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Select
            value={r.chosen}
            placeholder="เลือกสินค้า"
            options={optionsFor(r)}
            showSearch
            allowClear
            optionFilterProp="label"
            style={{ width: "100%" }}
            onChange={(v) => chooseItem(r, v)}
          />
          <Flex gap={4} wrap="wrap" align="center">
            <MatchTag row={r} />
            {r.include && r.chosen && (groupCount.get(r.chosen) || 0) > 1 && (
              <Tooltip title="หลายแถวเป็นสินค้าตัวเดียวกัน ใบสั่งซื้อจะรวมเป็นบรรทัดเดียว (จำนวนรวม ราคาเฉลี่ย)">
                <Tag>รวมบรรทัด</Tag>
              </Tooltip>
            )}
            {r.chosen && itemMap.get(r.chosen)?.sup ? <Tag>สินค้าของผู้ขายนี้</Tag> : null}
          </Flex>
        </Space>
      ),
    },
    {
      title: "จำนวน",
      dataIndex: "qty",
      width: 150,
      render: (_, r) => (
        <InputNumber
          value={r.qty}
          min={0}
          style={{ width: "100%" }}
          addonAfter={(r.chosen && itemMap.get(r.chosen)?.unit) || r.doc?.unit || ""}
          onChange={(v) => updateRow(r.key, { qty: v })}
        />
      ),
    },
    {
      title: "ราคาซื้อ / ส่วนลด %",
      dataIndex: "price",
      width: 150,
      render: (_, r) => (
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <InputNumber
            value={r.price}
            min={0}
            style={{ width: "100%" }}
            placeholder="ราคา/หน่วย"
            onChange={(v) => updateRow(r.key, { price: v })}
          />
          <InputNumber
            value={r.discount}
            min={0}
            max={100}
            style={{ width: "100%" }}
            addonAfter="%"
            onChange={(v) => updateRow(r.key, { discount: v })}
          />
        </Space>
      ),
    },
    {
      title: "ยอด (ก่อน VAT)",
      dataIndex: "net",
      width: 190,
      align: "right",
      render: (_, r) => {
        const warns = rowWarnings(r);
        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Typography.Text strong>{num(lineNet(r))}</Typography.Text>
            {warns.map((w) => (
              <Typography.Text key={w} type="warning" style={{ fontSize: 12, display: "block", textAlign: "left" }}>
                {w}
              </Typography.Text>
            ))}
          </Space>
        );
      },
    },
  ];

  const doc = result?.document;
  const srcInfo = SUPPLIER_SOURCE[supplierSource] || null;
  const dateFarOff = buyDate && Math.abs(buyDate.diff(dayjs(), "day")) > 7;

  const SupplierBlock = supplier ? (
    <Flex justify="space-between" align="start" gap={8} wrap="wrap">
      <Space direction="vertical" size={2}>
        <Typography.Text strong style={{ fontSize: 16 }}>
          {[supplier.prename, supplier.supname].filter(Boolean).join(" ")}
        </Typography.Text>
        <Typography.Text type="secondary">
          {supplier.supcode}
          {supplier.taxnumber ? ` · เลขผู้เสียภาษี ${supplier.taxnumber}` : ""}
        </Typography.Text>
        {srcInfo && (
          <Tag color={srcInfo.color}>
            {srcInfo.text}
            {supplierSource === "name" ? ` ${Math.round((result?.supplier?.score || 0) * 100)}%` : ""}
          </Tag>
        )}
      </Space>
      <Button icon={<SwapOutlined />} onClick={() => setOpenSupplier(true)}>
        เปลี่ยนผู้ขาย
      </Button>
    </Flex>
  ) : (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Alert
        type="warning"
        showIcon
        message="หาผู้ขายในระบบไม่เจอ"
        description={
          doc?.supplier?.name
            ? `ในเอกสารเขียนว่า "${doc.supplier.name}"${doc?.supplier?.tax_id ? ` เลขผู้เสียภาษี ${doc.supplier.tax_id}` : ""}`
            : "อ่านชื่อผู้ขายจากเอกสารไม่ได้"
        }
      />
      {(result?.supplier?.candidates || []).length > 0 && (
        <Flex gap={6} wrap="wrap">
          <Typography.Text type="secondary">ใกล้เคียง:</Typography.Text>
          {result.supplier.candidates.map((c) => (
            <Button key={c.supcode} size="small" onClick={() => handleSupplierPicked(c)}>
              {c.supname} ({Math.round(c.score * 100)}%)
            </Button>
          ))}
        </Flex>
      )}
      <Button type="primary" ghost onClick={() => setOpenSupplier(true)}>
        เลือกผู้ขาย
      </Button>
    </Space>
  );

  /* ------------------------------------------------------------ layout */

  return (
    <div className="layout-content px-3 sm:px-5 md:px-5">
      <div className="purchase-order-ai-scan" style={{ paddingBottom: 24 }}>
        <Flex justify="space-between" align="center" className="mb-3" wrap="wrap" gap={8}>
          <Space direction="vertical" size={0}>
            <Typography.Title level={3} className="m-0 !text-zinc-800">
              ใบสั่งซื้ออ่านค่าจาก AI <Tag color="purple">ทดสอบ</Tag>
            </Typography.Title>
            <Typography.Text type="secondary">
              ถ่ายรูปบิล / ใบส่งของ → ตรวจที่ระบบอ่านได้ → ส่งไปสร้างใบสั่งซื้อ
            </Typography.Text>
          </Space>
          <Space>
            {result && (
              <Button icon={<ReloadOutlined />} onClick={resetAll} disabled={busy}>
                สแกนใบใหม่
              </Button>
            )}
            <ButtonBack target={gotoFrom} />
          </Space>
        </Flex>

        {result?.mock && (
          <Alert
            className="mb-3"
            type="info"
            showIcon
            message="โหมดจำลอง (AI_MOCK=1)"
            description="ข้อมูลชุดนี้สร้างจากผู้ขายและสินค้าในระบบ ไม่ได้อ่านจากรูปจริง ใช้ทดสอบขั้นตอนเท่านั้น"
          />
        )}

        <Row gutter={[16, 16]}>
          {/* ---------------- รูปต้นฉบับ ---------------- */}
          <Col xs={24} lg={8}>
            <Card title="เอกสารผู้ขาย" size="small" style={{ position: "sticky", top: 12 }}>
              {!preview && !isPdf ? (
                <Upload.Dragger
                  accept="image/*,application/pdf"
                  multiple={false}
                  showUploadList={false}
                  beforeUpload={handleFile}
                  disabled={busy}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">แตะเพื่อถ่ายรูป หรือลากไฟล์มาวาง</p>
                  <p className="ant-upload-hint">
                    บิล / ใบส่งของ / ใบกำกับภาษี · รูป JPG, PNG หรือ PDF · ถ่ายให้เห็นทั้งใบ
                  </p>
                </Upload.Dragger>
              ) : (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {preview ? (
                    <Image src={preview} alt="เอกสารผู้ขาย" style={{ width: "100%", borderRadius: 6 }} />
                  ) : (
                    <Empty description="ไฟล์ PDF — ดูต้นฉบับจากไฟล์ในเครื่อง" />
                  )}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    กดที่รูปเพื่อขยาย เทียบกับข้อมูลด้านขวาได้
                  </Typography.Text>
                </Space>
              )}
            </Card>
          </Col>

          {/* ---------------- ผลที่อ่านได้ ---------------- */}
          <Col xs={24} lg={16}>
            <Spin spinning={busy} tip={`${busyText} ${elapsed ? `${elapsed} วิ` : ""}`}>
              {error && (
                <Alert
                  className="mb-3"
                  type="error"
                  showIcon
                  message="อ่านเอกสารไม่สำเร็จ"
                  description={error}
                  action={
                    <Button size="small" onClick={resetAll}>
                      ลองใหม่
                    </Button>
                  }
                />
              )}

              {!result && !busy && !error && (
                <Card size="small">
                  <Empty description="ยังไม่มีข้อมูล — เลือกรูปเอกสารทางซ้าย" />
                </Card>
              )}

              {result && (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Card size="small" title="หัวเอกสาร">
                    <Row gutter={[16, 12]}>
                      <Col xs={24} md={14}>
                        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                          ผู้ขาย
                        </Typography.Text>
                        {SupplierBlock}
                      </Col>
                      <Col xs={24} md={10}>
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <div>
                            <Typography.Text type="secondary">เลขที่เอกสารผู้ขาย</Typography.Text>
                            <Input value={docNo} onChange={(e) => setDocNo(e.target.value)} placeholder="ไม่พบในเอกสาร" />
                          </div>
                          <div>
                            <Typography.Text type="secondary">วันที่ซื้อ (ใช้เป็นวันที่ใบสั่งซื้อ)</Typography.Text>
                            <DatePicker
                              value={buyDate}
                              onChange={setBuyDate}
                              format={dateFormat}
                              allowClear={false}
                              style={{ width: "100%" }}
                            />
                            {!doc?.document_date && (
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                ไม่พบวันที่ในเอกสาร ใช้วันนี้แทน
                              </Typography.Text>
                            )}
                            {dateFarOff && (
                              <Typography.Text type="warning" style={{ fontSize: 12, display: "block" }}>
                                วันที่ห่างจากวันนี้เกิน 7 วัน — ตรวจว่า AI อ่านปีถูกหรือไม่
                              </Typography.Text>
                            )}
                          </div>
                        </Space>
                      </Col>
                    </Row>
                    {doc?.notes && <Alert className="mt-3" type="info" showIcon message={doc.notes} />}
                  </Card>

                  <Card size="small" title={`รายการในเอกสาร (${rows.length})`}>
                    <Table
                      rowKey="key"
                      size="small"
                      columns={columns}
                      dataSource={rows}
                      pagination={false}
                      scroll={{ x: 1120 }}
                      rowClassName={(r) => (!r.include ? "opacity-60" : "")}
                      locale={{ emptyText: "อ่านรายการสินค้าจากเอกสารไม่ได้" }}
                    />
                  </Card>

                  <Card size="small">
                    <Row gutter={[16, 12]} align="middle">
                      <Col xs={24} md={12}>
                        <Space direction="vertical" size={0}>
                          <Typography.Text>
                            ยอดก่อน VAT <b>{num(totals.net)}</b> · VAT {num(totals.vat)} · รวม{" "}
                            <b>{num(totals.total)}</b>
                          </Typography.Text>
                          {(doc?.grand_total != null || doc?.subtotal != null) && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              ในเอกสาร:
                              {doc?.subtotal != null ? ` ก่อน VAT ${num(doc.subtotal)}` : ""}
                              {doc?.vat != null ? ` · VAT ${num(doc.vat)}` : ""}
                              {doc?.grand_total != null ? ` · รวม ${num(doc.grand_total)}` : ""}
                            </Typography.Text>
                          )}
                          <Typography.Text style={{ fontSize: 13 }}>
                            พร้อมส่ง <b>{readyRows.length}</b> แถว
                            {needCheck > 0 && (
                              <>
                                {" "}
                                · <Typography.Text type="warning">ควรตรวจ {needCheck}</Typography.Text>
                              </>
                            )}
                            {unmatched > 0 && (
                              <>
                                {" "}
                                · <Typography.Text type="danger">ยังไม่จับคู่ {unmatched}</Typography.Text>
                              </>
                            )}
                          </Typography.Text>
                        </Space>
                      </Col>
                      <Col xs={24} md={12}>
                        <Flex vertical align="end" gap={4}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<TbSquareRoundedCheck style={{ fontSize: "1.1rem" }} />}
                            className="bn-center"
                            disabled={!supplier || readyRows.length === 0 || busy}
                            onClick={handleSend}
                          >
                            สร้างใบสั่งซื้อ
                          </Button>
                          <Typography.Text type="secondary" style={{ fontSize: 12, textAlign: "right" }}>
                            ยังไม่บันทึกอะไร — ตรวจอีกครั้งที่หน้าใบสั่งซื้อ (กดบันทึกแล้วสินค้าเข้าสต๊อกทันที)
                          </Typography.Text>
                        </Flex>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              )}
            </Spin>
          </Col>
        </Row>

        {openSupplier && (
          <ModalSupplier
            show={openSupplier}
            close={() => setOpenSupplier(false)}
            values={(v) => handleSupplierPicked(v)}
          />
        )}
      </div>
    </div>
  );
}

export default PurchaseOrderAiScan;
