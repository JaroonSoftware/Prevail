/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Flex,
  message,
  Badge,
  Card,
  Select,
  InputNumber,
  Modal,
} from "antd";
import { Row, Col, Space } from "antd";
import { SaveFilled } from "@ant-design/icons";
import { ButtonBack } from "../../components/button";
import { Items } from "./model";
import { useLocation, useNavigate } from "react-router";
import { delay } from "../../utils/util";
// import Swal from "sweetalert2";
// import OptionService from '../../service/Options.service';
import Itemservice from "../../service/Items.Service";
import OptionService from "../../service/Options.service";

import "./item-form.css";

/* จำนวนช่องชื่อย่อยที่ให้กรอก */
const ALIAS_SLOTS = 5;


const itemservice = Itemservice();
const opService = OptionService();
const from = "/items";

const ItemsManage = ({ embedded = false, initialItem = {}, onSaved, onCancel, onBusyChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const config = embedded ? { action: "create", title: "เพิ่มสินค้า" } : (location.state?.config || { action: "create" });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [form] = Form.useForm();
  // const [formImage] = Form.useForm();
  const [formDetail, setFormDetail] = useState(Items);
  const [optionUnit, setOptionUnit] = useState([]);
  const [optionType, setOptionType] = useState([]);
  const [optionGroup, setOptionGroup] = useState([]);

  useEffect(() => {
    // setLoading(true);
    GetItemsUnit();
    GetItemsType();
    opService.optionsCatalogGroup().then((res) => setOptionGroup(res?.data?.data || [])).catch(() => {});

    if (config?.action !== "create") {
      getsupData(config.code);
    } else {
      form.setFieldValue("vat", 0);
      form.setFieldValue("weight_stable", "N");
      form.setFieldValue("packing_weight", 1);
      if (embedded) {
        const defaults = { ...Items, buyprice: 0, price: 0, weight: 0, remark: "", aliases: [], vat: 0, weight_stable: "N", packing_weight: 1, ...initialItem };
        setFormDetail(defaults);
        form.setFieldsValue(defaults);
      }
    }
    // console.log(config);

    return () => {
      form.resetFields();
    };
  }, []);

  const GetItemsType = () => {
    opService.optionsItemstype().then((res) => {
      let { data } = res.data;
      setOptionType(data);
    });
  };

  const GetItemsUnit = () => {
    opService.optionsUnit().then((res) => {
      let { data } = res.data;
      setOptionUnit(data);
    });
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const getsupData = (v) => {
    itemservice
      .get(v)
      .then(async (res) => {
        const { data } = res.data;

        const init = {
          ...data,
          /* PDO คืนตัวเลขเป็นข้อความ แปลงให้ตรงกับ value ของ Select */
          catalog_group_id: data?.catalog_group_id ? Number(data.catalog_group_id) : undefined,
        };

        setFormDetail(init);
        form.setFieldsValue({ ...init });
      })
      .catch((err) => {
        console.log(err);
        message.error("Error getting infomation Product.");
      });
  };

  const validateItemCode = async (_, value) => {
    if (config.action !== "create") return;
    const code = String(value || "").trim();
    if (!code) throw new Error("กรุณาระบุรหัสสินค้า");
    let res;
    try { res = await itemservice.get(code); }
    catch { throw new Error("ตรวจสอบรหัสสินค้าไม่สำเร็จ กรุณาลองใหม่"); }
    if (res?.data?.data) throw new Error("รหัสสินค้านี้มีอยู่แล้ว กรุณาใช้รหัสสินค้าอื่น");
  };

  const handleConfirm = async () => {
    if (savingRef.current) return;
    let values;
    try { values = await form.validateFields(); } catch { return; }
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); onBusyChange?.(true);
    const source = { ...formDetail, ...values, stcode: String(values.stcode || '').trim() };
    /* ชื่อสินค้าซ้ำกับสินค้าอื่นในระบบ -> เตือนก่อนบันทึก (ไม่บล็อก บางครั้งชื่อซ้ำแต่คนละขนาด/หน่วย) */
    try {
      const all = (await opService.optionsItems({ p: 'items' }))?.data?.data || [];
      const norm = (x) => String(x || '').replace(/\s+/g, '').toLowerCase();
      const dups = all.filter((i) => norm(i.stname) === norm(source.stname) && String(i.stcode) !== source.stcode);
      if (dups.length) {
        const ok = await new Promise((resolve) => Modal.confirm({
          title: 'ชื่อสินค้าซ้ำกับสินค้าที่มีอยู่แล้ว',
          content: <>{dups.map((d) => <div key={d.stcode}>• {d.stcode} {d.stname} ({d.unit || '-'})</div>)}<div style={{ marginTop: 8 }}>ต้องการบันทึกต่อหรือไม่?</div></>,
          okText: 'บันทึกต่อ', cancelText: 'กลับไปแก้',
          onOk: () => resolve(true), onCancel: () => resolve(false),
        }));
        if (!ok) { savingRef.current = false; setSaving(false); onBusyChange?.(false); return; }
      }
    } catch { /* ตรวจชื่อซ้ำไม่ได้ ไม่ขวางการบันทึก */ }
    try {
      if (config.action === 'create') await itemservice.create(source);
      else await itemservice.update(source);
    } catch (err) {
      if (err?.response?.data?.code === 'DUPLICATE_ITEM_CODE') {
        form.setFields([{ name: 'stcode', errors: ['รหัสสินค้านี้มีอยู่แล้ว กรุณาใช้รหัสสินค้าอื่น'] }]);
      }
      message.error(err?.response?.data?.message || 'บันทึกสินค้าไม่สำเร็จ');
      savingRef.current = false; setSaving(false); onBusyChange?.(false);
      return;
    }
    savingRef.current = false; setSaving(false); onBusyChange?.(false);
    message.success('บันทึกสินค้าเรียบร้อยแล้ว');
    if (embedded) { onSaved?.(source); return; }
    navigate(from, { replace: true });
    await delay(300);
    console.clear();
  };

  const Detail = (
    <>
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item
            label="รหัสสินค้า"
            value=" "
            name="stcode"
            validateTrigger="onBlur"
            rules={[{ validator: validateItemCode }]}
          >
            <Input
              disabled={config.action === "edit"}
              placeholder="กรอกรหัสสินค้า"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
          <Form.Item
            label="ชื่อสินค้า"
            name="stname"
            rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
          >
            <Input placeholder="กรอกชื่อสินค้า" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
          <Form.Item
            label="ชื่อสินค้าภาษาอังกฤษ"
            name="stnameEN"
            rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
          >
            <Input placeholder="กรอกชื่อสินค้าภาษาอังกฤษ" />
          </Form.Item>
        </Col>
        {/* ชื่อย่อย (ชื่อเรียกอื่น) ของสินค้า เพิ่มได้ไม่จำกัด ไม่บังคับกรอก
            ใช้ให้ AI อ่านบิลจับคู่ชื่อที่เขียนไม่ตรงกับชื่อในระบบ
            เช่น ภาษาอื่น ชื่อย่อ ชื่อยี่ห้อ หรือสะกดต่างไป */}
        <Col xs={24} className="item-form-full-width">
          <Form.Item label="ชื่อย่อย (ชื่อเรียกอื่นของสินค้า)">
            {/* ช่องกรอกชื่อย่อย 5 ช่อง (เว้นว่างได้) — ถ้าสินค้าเดิมมีเกิน 5 ชื่อ จะแสดงครบทุกชื่อ */}
            <Form.Item noStyle shouldUpdate={(a, b) => (a.aliases || []).length !== (b.aliases || []).length}>
              {({ getFieldValue }) => {
                const n = Math.max(ALIAS_SLOTS, (getFieldValue("aliases") || []).length);
                return (
                  <Row gutter={[8, 8]}>
                    {Array.from({ length: n }, (_, i) => (
                      <Col key={i} xs={24} sm={12} lg={8} xl={Math.floor(24 / ALIAS_SLOTS) || 4} xxl={Math.floor(24 / ALIAS_SLOTS) || 4}>
                        <Form.Item name={["aliases", i]} noStyle>
                          <Input placeholder={`ชื่อย่อย ${i + 1}`} maxLength={255} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                );
              }}
            </Form.Item>
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="หน่วยสินค้า" name="unit">
            <Select
              size="large"
              showSearch
              filterOption={filterOption}
              placeholder="เลือกหน่วยสินค้า"
              options={optionUnit.map((item) => ({
                value: item.value,
                label: item.value,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          {/* หมวดที่ใช้แบ่งแท็บในหน้ากรอกแคตตาล็อก (แยกจากประเภทสินค้า ที่รายงานเตรียมของใช้) */}
          <Form.Item label="หมวดแคตตาล็อก" name="catalog_group_id">
            <Select
              size="large"
              showSearch
              allowClear
              filterOption={filterOption}
              placeholder="เลือกหมวดแคตตาล็อก"
              options={optionGroup.map((g) => ({ value: Number(g.group_id), label: g.group_name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="ประเภทสินค้า" name="typecode">
            <Select
              size="large"
              showSearch
              filterOption={filterOption}
              placeholder="เลือกประเภทสินค้า"
              options={optionType.map((item) => ({
                value: item.typecode,
                label: item.typename,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="ราคาซื้อ" name="buyprice">
            <Input placeholder="กรอกราคาซื้อ" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="ราคาขาย (สำหรับสร้างแคตตาล็อค)" name="price">
            <Input placeholder="กรอกราคาขายสำหรับสร้างแคตตาล็อค" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4}>
          <Form.Item label="น้ำหนักต่อถุง" name="packing_weight">
            <InputNumber
              className="width-100 input-30 text-end"
              style={{ height: 40 }}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4}>
          <Form.Item label="ภาษี" name="vat">
            <InputNumber
              className="width-100 input-30 text-end"
              style={{ height: 40 }}
              min={0}
            />
          </Form.Item>
        </Col>        
      </Row>
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="โหมดน้ำหนักคงที่" name="weight_stable">
            <Select
              size="large"
              options={[
                {
                  value: "N",
                  label: <Badge status="error" text="ชั่งน้ำหนักตามหน้างาน" />,
                },
                {
                  value: "Y",
                  label: <Badge status="success" text="ใช้น้ำหนักคงที่" />,
                },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="น้ำหนักที่ตั้งไว้ให้คงที่" name="weight">
            <Input placeholder="น้ำหนัก" />
          </Form.Item>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={12}
          xl={12}
          xxl={4}
          style={
            config.action === "edit"
              ? { display: "inline" }
              : { display: "none" }
          }
        >
          <Form.Item label="สถานะการใช้งาน" name="active_status">
            <Select
              size="large"
              options={[
                {
                  value: "Y",
                  label: <Badge status="success" text="เปิดการใช้งาน" />,
                },
                {
                  value: "N",
                  label: <Badge status="error" text="ปิดการใช้งาน" />,
                },
              ]}
            />
          </Form.Item>
        </Col>        
      </Row>
    </>
  );

  const SectionBottom = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          {embedded ? <Button disabled={saving} onClick={onCancel}>ปิด</Button> : <ButtonBack target={from} />}
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            icon={<SaveFilled style={{ fontSize: "1rem" }} />}
            type="primary"
            loading={saving}
            style={{ width: "9.5rem" }}
            onClick={() => {
              handleConfirm();
            }}
          >
            บันทึก
          </Button>
        </Flex>
      </Col>
    </Row>
  );
  return (
    <div className={embedded ? "item-manage item-manage-embedded" : "item-manage xs:px-0 sm:px-0 md:px-8 lg:px-8"}>
      <Space direction="vertical" className="flex gap-2">
        <Form
          form={form}
          disabled={saving}
          name="form_in_modal_add"
          layout="vertical"
          size={embedded ? "large" : undefined}
          autoComplete="off"
          initialValues={{
            modifier: "public",
          }}
        >
          <Card title={config?.title}>{Detail}</Card>
        </Form>
        {SectionBottom}
      </Space>
    </div>
  );
};

export default ItemsManage;
