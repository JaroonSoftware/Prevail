import DocumentNumberPreview from "../../components/DocumentNumberPreview";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Table,
  Typography,
  message,
} from "antd";
import { Card, Col, Divider, Flex, Row, Space } from "antd";

import OptionService from "../../service/Options.service";
import SOService from "../../service/SO.service";
import ItemsManage from "../items/MyManage";
import AiSoImportService from "../../service/AiSoImport.service";
import { Alert, Select, Tag } from "antd";
import { PrinterOutlined, SaveFilled, SearchOutlined } from "@ant-design/icons";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";

import { soForm, columnsParametersEditableWithDrag, componentsEditableWithDrag } from "./model";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
// import { ModalItems } from "../../components/modal/itemsbyCL/modal-items";
import dayjs from "dayjs";
import { delay, comma } from "../../utils/util";
import { confirmDuplicateItem } from "../../utils/duplicateItem";
import { applyCatalogPrices } from "./catalogPricing";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";
import { TbSquareRoundedX, TbExclamationCircle } from "react-icons/tb";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackagePlus } from "react-icons/lu";

const opservice = OptionService();
const soservice = SOService();
const aiSoService = AiSoImportService();
/* ใบขายที่สร้างจาก PO ด้วย AI ยังไม่เข้าระบบอื่นจนกว่าจะยืนยัน */
const STATUS_DRAFT = "รอยืนยันใบขายสินค้า";

const gotoFrom = "/sales-order";
const dateFormat = "DD/MM/YYYY";
const SO_CREATE_SODATE_STORAGE_KEY = "so-create-latest-sodate";
const SO_CREATE_DELDATE_STORAGE_KEY = "so-create-latest-deldate";

const loadRememberedCreateDate = (storageKey, fieldName) => {
  const rawValue = localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    const todayKey = dayjs().format("YYYY-MM-DD");

    if (
      parsedValue?.savedDate !== todayKey ||
      !parsedValue?.[fieldName] ||
      !dayjs(parsedValue[fieldName]).isValid()
    ) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return parsedValue[fieldName];
  } catch (error) {
    localStorage.removeItem(storageKey);
    return null;
  }
};

const loadRememberedCreateSodate = () =>
  loadRememberedCreateDate(SO_CREATE_SODATE_STORAGE_KEY, "sodate");

const loadRememberedCreateDeldate = () =>
  loadRememberedCreateDate(SO_CREATE_DELDATE_STORAGE_KEY, "deldate");

const saveRememberedCreateDate = (storageKey, fieldName, value) => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      savedDate: dayjs().format("YYYY-MM-DD"),
      [fieldName]: value,
    })
  );
};

const saveRememberedCreateSodate = (sodate) =>
  saveRememberedCreateDate(SO_CREATE_SODATE_STORAGE_KEY, "sodate", sodate);

const saveRememberedCreateDeldate = (deldate) =>
  saveRememberedCreateDate(SO_CREATE_DELDATE_STORAGE_KEY, "deldate", deldate);

const clearRememberedCreateSodate = () => {
  localStorage.removeItem(SO_CREATE_SODATE_STORAGE_KEY);
};

const clearRememberedCreateDeldate = () => {
  localStorage.removeItem(SO_CREATE_DELDATE_STORAGE_KEY);
};

function MyManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomer, setOpenCustomer] = useState(false);
  // const [openProduct, setOpenProduct] = useState(false);

  /** SaleOrder state */
  const [soCode, setSOCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(soForm);
  const [rememberCreateSodate, setRememberCreateSodate] = useState(false);
  const [rememberCreateDeldate, setRememberCreateDeldate] = useState(false);

  const [unitOption, setUnitOption] = useState([]);
  const [stcodeOption, setStcodeOption] = useState([]);
  const [aiItemOptions, setAiItemOptions] = useState([]);
  const [aiItemsLoading, setAiItemsLoading] = useState(false);
  const itemRequest = useRef(0);
  /* ค่าล่าสุดของรายการสินค้า (ใช้ตอนจับคู่หลายรายการติดกัน ไม่ให้ทับกัน) */
  const listRef = useRef([]);
  const catalogBusy = useRef(false);
  const [catalogError, setCatalogError] = useState(false);
  const catalogNeedsReprice = useRef(false);

  /** รายการจาก PO ที่ AI จับคู่สินค้าไม่มั่นใจ (เฉพาะใบสถานะ "รอยืนยันใบขายสินค้า")
   *  จับคู่/ตัดทิ้งในหน้านี้ก่อน แล้วค่อยแจ้ง server ตอนกดบันทึก (ถ้าออกจากหน้าโดยไม่บันทึก รายการยังอยู่) */
  const [aiPending, setAiPending] = useState([]);
  const [aiPick, setAiPick] = useState({});
  const [createItemLine, setCreateItemLine] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [aiDone, setAiDone] = useState([]); // [{pending_id, stcode|null}] null = ไม่เอารายการนี้
  const isDraft = formDetail?.doc_status === STATUS_DRAFT;

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await soservice
          .get(config?.code)
          .catch((error) => message.error("get SaleOrder data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { socode, sodate, deldate } = header;
        setFormDetail(header);
        setListDetail(detail.map((d, i) => ({ ...d, _rid: i + 1 })));
        setSOCode(socode);
        form.setFieldsValue({
          ...header,
          sodate: dayjs(sodate),
          deldate: dayjs(deldate),
        });
        getstcodeList(header?.cuscode, deldate);
        if (header?.doc_status === STATUS_DRAFT) {
          aiSoService
            .pending(socode)
            .then((r) => {
              const rows = r?.data?.data || [];
              setAiPending(rows);
              /* ลำดับใน PO: รายการที่ AI ลงให้แล้วเรียงตาม PO อยู่แล้ว แต่ไม่รู้เลขบรรทัด
                 เลขที่ไม่ใช่ของรายการรอจับคู่ = เลขของรายการที่ลงแล้ว ตามลำดับ -> ใช้แทรกรายการที่จับคู่ทีหลังให้ถูกที่ */
              const pendSeq = new Set(rows.map((p) => Number(p.seq)));
              setListDetail((state) => {
                let n = 0;
                return state.map((d) => {
                  do { n++; } while (pendSeq.has(n));
                  return { ...d, _poSeq: n };
                });
              });
              setAiPick(Object.fromEntries(rows.map((p) => [p.pending_id, p.suggest_stcode || undefined])));
            })
            .catch(() => message.error("โหลดรายการรอจับคู่จาก PO ไม่สำเร็จ"));
        }
        // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
        // handleChoosedCustomer(head);
      } else {
        const rememberedSodate = loadRememberedCreateSodate();
        const rememberedDeldate = loadRememberedCreateDeldate();
        const defaultSodate = rememberedSodate
          ? dayjs(rememberedSodate)
          : dayjs(new Date());
        const defaultDeldate = rememberedDeldate
          ? dayjs(rememberedDeldate)
          : dayjs(new Date());

        setListDetail([
          {
            _rid: 1,
            stcode: "",
            stname: "",
            qty: 1,
            price: 0,
            unit: "",
            discount: 0,
            vat: 0,
          },
        ]);
        const { data: code } = (
          await soservice.code().catch((e) => {
            message.error("get SaleOrder code fail.");
          })
        ).data;
        setSOCode(code);
        // form.setFieldValue("discount", 0);
        const ininteial_value = {
          ...formDetail,
          socode: code,
          sodate: defaultSodate,
          deldate: defaultDeldate,
        };
        setRememberCreateSodate(Boolean(rememberedSodate));
        setRememberCreateDeldate(Boolean(rememberedDeldate));
        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
        getstcodeList("", defaultDeldate);
      }
      const [unitOprionRes] = await Promise.all([
        opservice.optionsUnit({ p: "unit-option" }),
      ]);
      // console.log(unitOprionRes.data.data)
      setUnitOption(unitOprionRes.data.data);
    };

    initial();
    return () => { itemRequest.current++; };
  }, []);

  useEffect(() => {
    if (listDetail) handleSummaryPrice();
    listRef.current = listDetail || [];
  }, [listDetail]);

  const getstcodeList = async (cuscode = "", deliveryDate = form.getFieldValue("deldate"), reprice = false) => {
    const request = ++itemRequest.current;
    catalogBusy.current = true;
    catalogNeedsReprice.current = reprice;
    setCatalogError(false);
    setAiItemsLoading(true);
    setStcodeOption([]);
    setAiItemOptions([]);
    const catalogDate = deliveryDate && dayjs(deliveryDate).isValid()
      ? dayjs(deliveryDate).format("YYYY-MM-DD") : undefined;
    const [catalogResult, itemsResult] = await Promise.allSettled([
      opservice.optionsItems({ p: "cl", cuscode, ...(catalogDate ? { catalog_date: catalogDate } : {}) }),
      opservice.optionsItems({ p: "items" }),
    ]);
    if (request !== itemRequest.current) return;
    const catalog = catalogResult.status === "fulfilled" ? (catalogResult.value?.data?.data || []) : [];
    setStcodeOption(catalog);
    setCatalogError(catalogResult.status === "rejected");
    if (catalogResult.status === "rejected") message.error("โหลดราคาจากแคตตาล็อกไม่สำเร็จ กรุณาลองใหม่ก่อนบันทึก");
    else if (reprice) {
      setListDetail((rows) => applyCatalogPrices(rows, catalog));
      catalogNeedsReprice.current = false;
    }
    if (itemsResult.status === "fulfilled") {
      const prices = new Map(catalog.map((i) => [String(i.stcode), i]));
      setAiItemOptions((itemsResult.value?.data?.data || []).map((i) => {
        const price = prices.get(String(i.stcode));
        return { ...i, value: i.stcode, label: i.stcode + " - " + i.stname,
          catalog_code: price?.catalog_code, packing_weight: price ? price.packing_weight : i.packing_weight,
          price: price ? price.price : null, unit: price?.unit || i.unit, vat: price?.vat ?? i.vat };
      }));
    } else message.error("โหลดสินค้าในระบบไม่สำเร็จ กรุณาเปิดหน้านี้ใหม่");
    catalogBusy.current = false;
    setAiItemsLoading(false);
  };

  const handleDeliveryDateChange = (date) => {
    setFormDetail((state) => ({ ...state, deldate: date }));
    getstcodeList(form.getFieldValue("cuscode") || "", date, true);
  };

  const handleSummaryPrice = () => {
    const newData = [...listDetail];

    const total_price = newData.reduce(
      (a, v) =>
        (a +=
          Number(v?.qty || 0) * Number(v?.price || 0) +
          Number(v?.qty || 0) * Number(v?.price || 0) * (v?.vat / 100)),
      0
    );
    // const discount = form.getFieldValue("discount");
    // const grand_total_price =
    //   total_price - form.getFieldValue("discount");

    setFormDetail((state) => ({
      ...state,
      total_price,
      // discount,
      // grand_total_price,
    }));
    // console.log(formDetail)
  };

  const handleCalculatePrice = (day, date) => {
    const newDateAfterAdding = dayjs(date || new Date()).add(
      Number(day),
      "day"
    );
    const nDateFormet = newDateAfterAdding.format("YYYY-MM-DD");

    setFormDetail((state) => ({ ...state, dated_price_until: nDateFormet }));
    form.setFieldValue("dated_price_until", nDateFormet);
  };

  const handleSO = (e) => {
    const { valid_price_until } = form.getFieldsValue();
    if (!!valid_price_until && !!e) {
      handleCalculatePrice(valid_price_until || 0, e || new Date());
    }
  };

  /** Function modal handle */
  const handleChoosedCustomer = (val) => {
    // console.log(val)
    const fvalue = form.getFieldsValue();
    const addr = [
      !!val?.idno ? `${val.idno} ` : "",
      !!val?.road ? `${val?.road} ` : "",
      !!val?.subdistrict ? `${val.subdistrict} ` : "",
      !!val?.district ? `${val.district} ` : "",
      !!val?.province ? `${val.province} ` : "",
      !!val?.zipcode ? `${val.zipcode} ` : "",
      !!val?.country ? `(${val.country})` : "",
    ];
    const customer = {
      ...val,
      address: addr.join(""),
      contact: val.contact,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customer }));
    form.setFieldsValue({ ...fvalue, ...customer });
    /* เปลี่ยนลูกค้า: เก็บรายการสินค้าไว้ แล้วดึงราคาจากแคตตาล็อกของลูกค้าใหม่
       (สินค้าที่ไม่อยู่ในแคตตาล็อกลูกค้าใหม่ คงราคาเดิมไว้) */
    getstcodeList(val?.cuscode, form.getFieldValue("deldate"), true);
  };

  // const handleItemsChoosed = (value) => {
  //   // console.log(value)
  //   setListDetail(value);
  //   handleSummaryPrice();
  // };

  /* ใช้สินค้าที่เลือกกับรายการจาก PO -> เพิ่มเป็นแถวในตารางใบขาย */
  const handleUsePending = async (p, createdItem = null) => {
    if (catalogBusy.current || catalogError) return message.warning("กรุณารอโหลดแคตตาล็อกให้สำเร็จก่อนเพิ่มสินค้า");
    const request = itemRequest.current;
    const stcode = aiPick[p.pending_id];
    const opt = createdItem || aiItemOptions.find((o) => o.stcode === stcode || o.value === stcode);
    if (!opt) return message.warning("กรุณาเลือกสินค้า (ต้องเป็นสินค้าในแคตตาล็อกของลูกค้ารายนี้)");
    if (!(await confirmDuplicateItem(listDetail, { stcode: opt.stcode, stname: opt.stname || opt.label }))) return;
    if (request !== itemRequest.current) return message.warning("วันที่นัดส่งมีการเปลี่ยนแปลง กรุณาเลือกสินค้าอีกครั้ง");
    let savedRows = null;
    {
      const state = listRef.current;
      const rows = state.filter((d) => d.stcode); // ตัดแถวว่างที่ยังไม่เลือกสินค้าทิ้ง
      const seq = Number(p.seq) || Infinity;
      const row = {
        _poSeq: seq,
        _rid: Math.max(0, ...state.map((d) => Number(d._rid) || 0)) + 1,
        stcode: opt.stcode,
        stname: opt.stname || opt.label,
        qty: Number(p.qty) > 0 ? Number(p.qty) : 1,
        price: Number(opt.price ?? p.price ?? 0),
        unit: opt.unit,
        catalog_code: opt.catalog_code,
        packing_weight: opt.packing_weight,
        vat: Number(opt.vat || 0),
        discount: 0,
        /* ชื่อ/รหัสใน PO ติดบรรทัดไว้ — ถ้าเปลี่ยนสินค้าในตารางภายหลัง ระบบจะจำค่าที่แก้ตอนยืนยัน */
        ai_raw: p.raw_name || null,
        ai_raw_code: p.raw_code || null,
        ai_stcode: opt.stcode,
      };
      /* แทรกตามลำดับบรรทัดใน PO (ก่อนแถวแรกที่ลำดับ PO มากกว่า) */
      const at = rows.findIndex((d) => d._poSeq != null && d._poSeq > seq);
      savedRows = at < 0 ? [...rows, row] : [...rows.slice(0, at), row, ...rows.slice(at)];
    }
    listRef.current = savedRows;
    setListDetail(savedRows);
    setAiPending((s) => s.filter((x) => x.pending_id !== p.pending_id));
    /* บันทึกลงฐานข้อมูลทันที (กันรีเฟรชหน้าแล้วรายการที่จับคู่หาย) */
    if (isDraft && config?.action !== "create" && savedRows) {
      autoSavePending(savedRows, p.pending_id, opt.stcode);
    } else {
      setAiDone((s) => [...s, { pending_id: p.pending_id, stcode: opt.stcode }]);
    }
  };

  /* บันทึกใบขาย (รอยืนยัน) + ปิดรายการรอจับคู่ ต่อคิวทีละครั้ง กันกดรัวแล้วบันทึกชนกัน */
  const autoSaveChain = useRef(Promise.resolve());
  const autoSavePending = (rows, pendingId, stcode) => {
    autoSaveChain.current = autoSaveChain.current.then(async () => {
      try {
        const header = {
          ...formDetail,
          sodate: dayjs(form.getFieldValue("sodate")).format("YYYY-MM-DD"),
          deldate: dayjs(form.getFieldValue("deldate")).format("YYYY-MM-DD"),
          customer_po: form.getFieldValue("customer_po"),
          del_room: form.getFieldValue("del_room"),
          remark: form.getFieldValue("remark"),
        };
        await soservice.update({ header, detail: rows }, { ignoreLoading: true });
        await aiSoService.resolvePending(pendingId, stcode);
        message.success({ content: "บันทึกรายการที่จับคู่แล้ว", key: "ai-autosave", duration: 1.5 });
      } catch (err) {
        /* บันทึกไม่สำเร็จ: เก็บไว้บันทึกตอนกด Save ตามเดิม */
        setAiDone((s) => [...s, { pending_id: pendingId, stcode }]);
        message.warning({ content: (err?.response?.data?.message || "บันทึกอัตโนมัติไม่สำเร็จ") + " — กรุณากด Save", key: "ai-autosave" });
      }
    });
  };


  /* แจ้ง server ว่ารายการรอจับคู่ไหนจัดการแล้ว (จำชื่อใน PO คู่กับสินค้าไว้ใช้ครั้งหน้า) */
  const handleDeletePending = (row) => {
    Modal.confirm({
      title: "ลบรายการที่ AI นำเข้าผิด?",
      content: "ลบรายการ " + row.raw_name + " ออกจากใบขายนี้ทันที",
      okText: "ลบรายการ", cancelText: "ยกเลิก", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await aiSoService.dropPending(row.pending_id);
          setAiPending((old) => old.filter((p) => p.pending_id !== row.pending_id));
          setAiPick((old) => { const next = { ...old }; delete next[row.pending_id]; return next; });
          message.success("ลบรายการแล้ว");
        } catch (err) {
          message.error(err?.response?.data?.message || "ลบรายการไม่สำเร็จ");
          throw err;
        }
      },
    });
  };

  const handleItemSaved = (item) => {
    if (!createItemLine) return;
    const option = { ...item, value: item.stcode, label: item.stcode + " - " + item.stname };
    setAiItemOptions((old) => [...old.filter((i) => i.stcode !== item.stcode), option]);
    setStcodeOption((old) => [...old.filter((i) => i.stcode !== item.stcode), option]);
    handleUsePending(createItemLine, option);
    setCreateItemLine(null);
  };

  const flushAiDone = async () => {
    for (const d of aiDone) {
      if (d.stcode) await aiSoService.resolvePending(d.pending_id, d.stcode);
      else throw new Error("ต้องจับคู่รหัสสินค้าก่อนบันทึก");
    }
    setAiDone([]);
  };

  const handleConfirm = (confirmDraft = false) => {
    if (catalogBusy.current || catalogError) {
      message.warning("กรุณารอโหลดแคตตาล็อกให้สำเร็จก่อนบันทึก");
      return;
    }
    let errormessage = "";
    const catalogRequest = itemRequest.current;

    form
      .validateFields()
      .then((v) => {
        if (catalogBusy.current || catalogRequest !== itemRequest.current) {
          message.warning("วันที่นัดส่งมีการเปลี่ยนแปลง กรุณารอโหลดราคาแล้วบันทึกอีกครั้ง");
          return;
        }
        if (listDetail.length < 1 && !(isDraft && !confirmDraft && aiPending.length > 0))
          throw (errormessage = "กรุณาเพิ่มรายการสินค้า");

        if (listDetail.some((ld) => !String(ld.stcode || "").trim()))
          throw (errormessage = "กรุณาเลือกสินค้าที่ต้องการขายให้ครบถ้วน");

        if (confirmDraft && aiPending.length > 0)
          throw (errormessage = `ยังมีรายการจาก PO ที่ยังไม่ได้จับคู่ ${aiPending.length} รายการ (เลือกสินค้า หรือกด "ไม่เอา")`);

        const header = {
          ...formDetail,
          sodate: dayjs(form.getFieldValue("sodate")).format("YYYY-MM-DD"),
          deldate: dayjs(form.getFieldValue("deldate")).format("YYYY-MM-DD"),
          customer_po: form.getFieldValue("customer_po"),
          del_room: form.getFieldValue("del_room"),
          remark: form.getFieldValue("remark"),
        };
        const detail = listDetail;

        const parm = { header, detail };
        console.log(parm);
        const actions =
          config?.action !== "create" ? soservice.update : soservice.create;
        /* ใบที่ปริ้นหน้าถุงแล้ว: ถ้าการแก้จะล้าง barcode บางรายการ server ตอบ 409 -> ถามยืนยันแล้วส่งใหม่ */
        const send = (p) => actions(p).catch((err) => {
          const d = err?.response?.data;
          if (err?.response?.status !== 409 || d?.code !== "LABELS_WILL_CLEAR") throw err;
          return new Promise((resolve, reject) => Modal.confirm({
            width: 560,
            title: "รายการนี้ปริ้นหน้าถุงแล้ว",
            content: (
              <>
                <div>รายการที่แก้/ลบ จะถูกล้าง barcode และต้องปริ้นหน้าถุงใหม่:</div>
                {(d?.data?.clear || []).map((c, i) => (
                  <div key={i}>• {c.stcode} {c.stname} {c.qty != null ? `(${c.qty} ${c.unit})` : ""} — {c.bags} ถุง</div>
                ))}
                <div style={{ color: "#cf1322", marginTop: 8 }}>สติ๊กเกอร์เดิมของรายการเหล่านี้จะสแกนไม่ได้ · รายการที่ไม่ได้แก้ยังใช้ถุงเดิมได้</div>
              </>
            ),
            okText: "ยืนยัน บันทึก", okType: "danger", cancelText: "ยกเลิก",
            onOk: () => actions({ ...p, confirm_clear_labels: true }).then(resolve, reject),
            onCancel: () => reject({ cancelled: true }),
          }));
        });
        send(parm)
          .then(async (r) => {
            const savedDocument = r?.data?.data?.document_code || r?.data?.data?.catalog_code;
            if (isDraft) {
              await flushAiDone();
              if (confirmDraft) {
                const cf = await aiSoService.confirm(header.socode);
                const learned = cf?.data?.data?.learned || 0;
                if (learned > 0) message.info(`ระบบจำสินค้าที่แก้ไว้ ${learned} รายการ — PO ครั้งหน้าจะจับคู่ให้เอง`, 5);
              }
            }
            if (config?.action === "create") {
              if (rememberCreateSodate) {
                saveRememberedCreateSodate(header.sodate);
              } else {
                clearRememberedCreateSodate();
              }

              if (rememberCreateDeldate) {
                saveRememberedCreateDeldate(header.deldate);
              } else {
                clearRememberedCreateDeldate();
              }
            }
            handleClose().then((r) => {
              message.success(savedDocument ? `บันทึกเอกสาร ${savedDocument} สำเร็จ` : (confirmDraft ? "ยืนยันใบขายสินค้าแล้ว" : "Request SaleOrder success."));
            });
          })
          .catch((err) => {
            if (err?.cancelled) return;
            message.error(err?.response?.data?.message || "Request SaleOrder fail.");
            console.warn(err);
          });
      })
      .catch((err) => {
        if (errormessage === "")
          errormessage = "กรุณาเลือกลูกค้า ก่อนทำการบันทึกข้อมูล";
        Modal.error({
          title: "ข้อผิดพลาด",
          content: errormessage,
        });
      });
  };

  const handleClose = async () => {
    navigate(gotoFrom, { replace: true });
    await delay(300);
    console.clear();
  };

  const handlePrint = () => {
    if (!soCode) return;
    const url = `/so-print/${soCode}`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  };

  const handleDelete = (rid) => {
    const itemDetail = [...listDetail];
    const newData = itemDetail.filter((item) => item?._rid !== rid);
    setListDetail([...newData]);
  };

  const handleRemove = (record) => {
    const itemDetail = [...listDetail];
    return itemDetail.length >= 1 ? (
      <Button
        className="bt-icon"
        size="small"
        danger
        icon={
          <RiDeleteBin5Line style={{ fontSize: "1rem", marginTop: "3px" }} />
        }
        onClick={() => handleDelete(record?._rid)}
      />
    ) : null;
  };

  const handleCancleSO = () => {
    Modal.confirm({
      title: (
        <Flex align="center" gap={2} className="text-red-700">
          <TbExclamationCircle style={{ fontSize: "1.5rem" }} />
          {"ยืนยันที่จะยกเลิกใบขายสินค้า"}
        </Flex>
      ),
      icon: <></>,
      content: "ต้องการยกเลิกใบขายสินค้า ใช่หรือไม่",
      okText: "ยืนยัน",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk() {
        soservice
          .deleted(formDetail.socode)
          .then((r) => {
            handleClose().then((r) => {
              message.success("ยกเลิกใบขายสินค้าสำเร็จ");
            });
          })
          .catch((err) => {
            message.error("Request SaleOrder fail.");
            console.warn(err);
          });
        // setListSouce((state) => state.filter( soc => soc.stcode !== key));
      },
      // onCancel() { },
    });
  };

  const handleEditCell = (row) => {
    if (catalogBusy.current) return;
    const request = itemRequest.current;
    /* เลือกสินค้าในแถวนี้ใหม่ และสินค้านี้มีอยู่แล้วในบรรทัดอื่น -> เตือนก่อน */
    const prev = listDetail.find((item) => item._rid === row._rid);
    if (row?.stcode && prev && row.stcode !== prev.stcode) {
      confirmDuplicateItem(listDetail, row, (r) => r._rid === row._rid).then((ok) => {
        if (request !== itemRequest.current) return;
        if (ok) applyEditCell(row);
        else setListDetail((s) => [...s]); // คืนค่าเดิมในช่อง
      });
      return;
    }
    applyEditCell(row);
  };

  const applyEditCell = (row) => {
    const newData = (r) => {
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      const ind = newData.findIndex((item) => item._rid === r._rid);
      if (ind < 0) return itemDetail;
      const item = newData[ind];
      newData.splice(ind, 1, {
        ...item,
        ...row,
        _catalogPriceMissing: row.catalog_code ? false : item._catalogPriceMissing,
      });

      handleSummaryPrice();
      return newData;
    };
    setListDetail([...newData(row)]);
  };

  const handleAddRow = () => {
    // alert("เพิ่มสินค้า");
    setListDetail((state) => [
      ...state,
      {
        _rid: state.length + 1,
        stcode: "",
        stname: "",
        qty: 1,
        price: 0,
        unit: "",
        discount: 0,
        vat: 0,
      },
    ]);
  };

  /** DnD sensors */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }));

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setListDetail((prev) => {
        const oldIndex = prev.findIndex((item) => String(item._rid) === String(active.id));
        const newIndex = prev.findIndex((item) => String(item._rid) === String(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  /** setting column table */
  const prodcolumns = columnsParametersEditableWithDrag(
    handleEditCell,
    unitOption,
    stcodeOption,
    {
      handleRemove,
      handleAddRow,
    }
  );

  const SectionCustomer = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
              rules={[{ required: true, message: "โปรดเลือกลูกค้า" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือก ลูกค้า"
                  id="cuscode-1"
                  value={formDetail.cuscode}
                  className="!bg-white"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setOpenCustomer(true)}
                  style={{ minWidth: 40 }}
                ></Button>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="Customer Name." readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              label="วันที่นัดส่งสินค้า"
              name="deldate"
              className="!m-0"
              rules={[{ required: true, message: "กรุณาเลือกวันที่นัดส่งสินค้า" }]}
            >
              <DatePicker
                size="large"
                placeholder="วันที่นัดส่งสินค้า"
                className="input-40"
                style={{ width: "100%" }}
                format={dateFormat}
                allowClear={false}
                onChange={handleDeliveryDateChange}
              />
            </Form.Item>
            {config?.action === "create" && (
              <Checkbox
                checked={rememberCreateDeldate}
                onChange={(event) =>
                  setRememberCreateDeldate(event.target.checked)
                }
              >
                จำวันที่นัดส่งสินค้าล่าสุดของวันนี้
              </Checkbox>
            )}
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item name="customer_po" label="PO ลูกค้า" className="!mb-1">
              <Input placeholder="Customer PO." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item name="del_room" label="ห้องครัว" className="!mb-1">
              <Input placeholder="Kitchen Room." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item name="tel" label="เบอร์โทรลูกค้า" className="!mb-1">
              <Input placeholder="Customer Tel." readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item name="contact" label="ผู้ติดต่อ" className="!mb-1">
              <Input placeholder="Customer Contact." readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input placeholder="Customer Address." readOnly />
            </Form.Item>
          </Col>          
        </Row>
      </Space>
    </>
  );

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการใบขายสินค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Button
            icon={<LuPackagePlus style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              handleAddRow();
            }}
          >
            เพิ่มสินค้า
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
          <SortableContext items={listDetail.map((i) => String(i._rid))} strategy={verticalListSortingStrategy}>
        <Table
          title={() => TitleTable}
          components={componentsEditableWithDrag}
          rowClassName={() => "editable-row"}
          bordered
          loading={aiItemsLoading}
          dataSource={listDetail}
          columns={prodcolumns}
          pagination={false}
          rowKey="_rid"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          summary={(record) => {
            return (
              <>
                {listDetail.length > 0 && (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={8}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        Grand Total
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {comma(Number(formDetail?.total_price || 0))}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              </>
            );
          }}
        />
          </SortableContext>
        </DndContext>
      </Flex>
    </>
  );

  const SectionAiPending = isDraft ? (
    <Card
      title={
        <Flex align="center" gap={8}>
          <span>ใบขายสินค้าจาก PO (AI) — รอยืนยัน</span>
          {aiPending.length > 0 ? <Tag color="volcano">รอจับคู่ {aiPending.length} รายการ</Tag> : <Tag color="green">จับคู่ครบแล้ว</Tag>}
        </Flex>
      }
      extra={
        <Button type="primary" style={{ background: "#389e0d" }} disabled={aiPending.length > 0 || listDetail.length === 0 || listDetail.some((d) => !String(d.stcode || "").trim())}
          onClick={() => handleConfirm(true)}>
          บันทึกและยืนยันใบขายสินค้า
        </Button>
      }
    >
      <Alert type="warning" showIcon className="!mb-3"
        message="ตรวจรายการ ราคา จำนวน ให้ถูกต้องก่อนกดยืนยัน — ใบนี้ยังไม่เข้าใบจัดสินค้า/ใบส่งของ/รายงานเตรียมของ จนกว่าจะยืนยัน" />
      {aiPending.length > 0 && (
        <Table size="small" rowKey="pending_id" pagination={false} bordered dataSource={aiPending}
          columns={[
            { title: "ข้อความจาก PO (รอจับคู่สินค้า)", dataIndex: "raw_name",
              render: (v, p) => <>{v}{p.confidence === "low" && <Tag color="red" className="!ms-2">อ่านไม่ชัด</Tag>}</> },
            { title: "จำนวน", dataIndex: "qty", width: 90, align: "right", render: (v) => (v == null ? "-" : comma(Number(v), 3, 2)) },
            { title: "หน่วยใน PO", dataIndex: "unit", width: 110 },
            { title: "ราคาใน PO", dataIndex: "price", width: 100, align: "right", render: (v) => (v == null ? "-" : comma(Number(v), 2, 2)) },
            { title: "สินค้าในระบบ", key: "pick", width: 320,
              render: (_, p) => (
                <Select showSearch allowClear style={{ width: "100%" }} placeholder="เลือกสินค้า"
                  options={aiItemOptions} loading={aiItemsLoading} disabled={aiItemsLoading} optionFilterProp="label"
                  value={aiPick[p.pending_id]}
                  onChange={(v) => setAiPick((s) => ({ ...s, [p.pending_id]: v }))} />
              ) },
            { title: "", key: "act", width: 220,
              render: (_, p) => (
                <Space size={4} wrap={false} style={{ whiteSpace: "nowrap" }}>
                  <Button size="small" type="primary" onClick={() => handleUsePending(p)}>เพิ่ม</Button>
                  <Button size="small" onClick={() => setCreateItemLine(p)}>{"\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e43\u0e2b\u0e21\u0e48"}</Button>
                  <Button size="small" danger onClick={() => handleDeletePending(p)}>ลบ</Button>
                </Space>
              ) },
          ]}
        />
      )}
      <Typography.Text type="secondary" className="block mt-2">
        หน่วยใน PO ต่างจากหน่วยในระบบ (เช่น ขีด = 0.1 กก.) ให้แก้จำนวนในตารางรายการด้านล่างหลังกด "เพิ่ม"
        — ระบบจะจำชื่อใน PO คู่กับสินค้าที่เลือกไว้ ครั้งหน้าจับคู่ให้เอง
      </Typography.Text>
    </Card>
  ) : null;

  const SectionOther = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item className="" name="remark" label="Remark">
              <Input.TextArea placeholder="Enter Remark" rows={4} />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  ///** button */

  const SectionTop = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={gotoFrom} />
        </Flex>
      </Col>
      <Col span={12} className="p-0">
        <Flex gap={4} justify="end">
          {formDetail.active_status === "Y" ? (
            <Button
              icon={<TbSquareRoundedX style={{ fontSize: "1.4rem" }} />}
              type="primary"
              onClick={() => handleCancleSO()}
              className="bn-center justify-center"
              style={{ width: "9.5rem" }}
              danger
            >
              ยกเลิกใบขายสินค้า
            </Button>
          ) : (
            <></>
          )}
          {config?.action !== "create" && soCode ? (
            <Button
              icon={<PrinterOutlined />}
              className="bn-center justify-center bn-primary-outline"
              style={{ width: "9.5rem" }}
              onClick={handlePrint}
            >
              Print SO
            </Button>
          ) : (
            <></>
          )}
          {formDetail.active_status === "Y" || config.action === "create" ? (
            <Button
              className="bn-center justify-center"
              icon={<SaveFilled style={{ fontSize: "1rem" }} />}
              type="primary"
              style={{ width: "9.5rem", marginLeft: "10px" }}
              onClick={() => {
                handleConfirm();
              }}
            >
              Save
            </Button>
          ) : (
            <></>
          )}
        </Flex>
      </Col>
    </Row>
  );

  const SectionBottom = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={gotoFrom} />
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          {config?.action !== "create" && soCode ? (
            <Button
              className="bn-center justify-center bn-primary-outline"
              icon={<PrinterOutlined />}
              style={{ width: "9.5rem" }}
              onClick={handlePrint}
            >
              Print SO
            </Button>
          ) : (
            <></>
          )}
          {formDetail.active_status === "Y" || config.action === "create" ? (
            <Button
              className="bn-center justify-center"
              icon={<SaveFilled style={{ fontSize: "1rem" }} />}
              type="primary"
              style={{ width: "9.5rem" }}
              onClick={() => {
                handleConfirm();
              }}
            >
              Save
            </Button>
          ) : (
            <></>
          )}
        </Flex>
      </Col>
    </Row>
  );

  return (
    <div className="quotation-manage">
      <Drawer title={"เพิ่มสินค้าจาก PO"} open={!!createItemLine}
        width={1000} styles={{ wrapper: { maxWidth: "100vw" } }}
        onClose={() => { if (!itemSaving) setCreateItemLine(null); }}
        maskClosable={!itemSaving} closable={!itemSaving} keyboard={!itemSaving}>
        {createItemLine && <ItemsManage key={createItemLine.pending_id} embedded
          onBusyChange={setItemSaving} onCancel={() => setCreateItemLine(null)} onSaved={handleItemSaved}
          initialItem={{ stname: createItemLine.raw_name || "", unit: createItemLine.unit || undefined,
            price: createItemLine.price ?? 0 }} />}
      </Drawer>
      <div id="quotation-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {SectionTop}
          <Form
            form={form}
            layout="vertical"
            className="width-100"
            autoComplete="off"
          >
            {/* style={{ backgroundColor: "red" }} */}
            <Card
              title={
                <>
                  <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Typography.Title level={3} className="m-0">
                        รหัสใบขายสินค้า : {soCode}
                      </Typography.Title>
                      <DocumentNumberPreview visible={config?.action === "create"} />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบขายสินค้า :{" "}
                        </Typography.Title>
                        <Form.Item name="sodate" className="!m-0">
                          <DatePicker
                            className="input-40"
                            allowClear={false}
                            onChange={handleSO}
                            format={dateFormat}
                          />
                        </Form.Item>
                        {config?.action === "create" && (
                          <Checkbox
                            checked={rememberCreateSodate}
                            onChange={(event) => setRememberCreateSodate(event.target.checked)}
                          >
                            จำวันที่ใบขายสินค้าล่าสุดของวันนี้
                          </Checkbox>
                        )}
                      </Flex>
                    </Col>
                  </Row>
                </>
              }
            >
              <Row className="m-0" gutter={[12, 12]}>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    {" "}
                    Customer{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionCustomer}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    {" "}
                    รายละเอียดอื่นๆ{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionOther}</Card>
                </Col>
                {isDraft && (
                  <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                    {SectionAiPending}
                  </Col>
                )}
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!my-0">
                    Product
                  </Divider>
                  <Card style={{ backgroundColor: "#f0f0f0" }}>
                    <Typography.Text type="secondary" className="block mb-2">
                      รายการและราคาแคตตาล็อกอิงวันที่นัดส่งสินค้า — เปลี่ยนวันที่แล้วราคาสินค้าในรายการจะปรับตาม
                    </Typography.Text>
                    {catalogError && <Alert type="error" showIcon className="!mb-3"
                      message="โหลดแคตตาล็อกไม่สำเร็จ กรุณาลองใหม่ก่อนบันทึก"
                      action={<Button onClick={() => getstcodeList(form.getFieldValue("cuscode") || "", form.getFieldValue("deldate"), catalogNeedsReprice.current)}>ลองใหม่</Button>} />}
                    {!aiItemsLoading && !catalogError && formDetail.cuscode && stcodeOption.length === 0 &&
                      <Alert type="warning" showIcon className="!mb-3" message="ไม่พบรายการในแคตตาล็อกที่เปิดใช้งานของลูกค้าในวันที่นัดส่งนี้" />}
                    {listDetail.some((row) => row._catalogPriceMissing) && <Alert type="warning" showIcon className="!mb-3"
                      message="บางรายการไม่มีราคาในแคตตาล็อกวันนัดส่ง หรือหน่วยไม่ตรงกัน ระบบคงราคาเดิมไว้ กรุณาตรวจสอบก่อนบันทึก"
                      description={listDetail.filter((row) => row._catalogPriceMissing).map((row) => `${row.stcode} ${row.stname || ""}`).join(", ")} />}
                    {SectionProduct}
                  </Card>
                </Col>
              </Row>
            </Card>
          </Form>
          {SectionBottom}
        </Space>
      </div>

      {openCustomer && (
        <ModalCustomers
          show={openCustomer}
          close={() => setOpenCustomer(false)}
          values={(v) => {
            handleChoosedCustomer(v);
          }}
        ></ModalCustomers>
      )}

      {/* {openProduct && (
        <ModalItems
          show={openProduct}
          close={() => setOpenProduct(false)}
          values={(v) => {
            handleItemsChoosed(v);
          }}
          cuscode={form.getFieldValue("cuscode")}
          selected={listDetail}
        ></ModalItems>
      )} */}
    </div>
  );
}

export default MyManage;
