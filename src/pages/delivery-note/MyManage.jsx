import DocumentNumberPreview from "../../components/DocumentNumberPreview";
import DocumentLink from "../../components/DocumentLink";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Button,
  Alert,
  DatePicker,
  Form,
  Input,
  Table,
  Typography,
  message,
  Modal,
  Tabs,
} from "antd";
import { Card, Col, Divider, Flex, Row, Space, Popconfirm, Select } from "antd";
import OptionService from "../../service/Options.service";
import CustomerService from "../../service/Customer.Service";
import DeliveryNoteService from "../../service/DeliveryNote.service";
import BillingNoteService from "../../service/BillingNote.Service";
import { SearchOutlined, SaveFilled,QuestionCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { InputNumber, Radio, Tag } from "antd";
import SOService from "../../service/SO.service";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import { ModalSO } from "../../components/modal/so-for-dn";

import {
  DEFALUT_CHECK_DELIVERY,
  columnsParametersEditable,
  componentsEditable,
} from "./model";

import dayjs from "dayjs";
import { delay, comma } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackageSearch } from "react-icons/lu";
import { TbExclamationCircle } from "react-icons/tb";
import { CloseCircleFilledIcon } from "../../components/icon";
import { Authenticate } from "../../service/Authenticate.service";
import AuditInfo from "../../components/AuditInfo";
const opservice = OptionService();
const customerService = CustomerService();
const dnservice = DeliveryNoteService();
const blservice = BillingNoteService();
const authService = Authenticate();
const soservice = SOService();
// const qtservice = QuotationService();

const dateFormat = "DD/MM/YYYY";

function DeliveryNoteManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const salesOrder = config?.action === "create" ? config.salesOrder : null;
  const gotoFrom = salesOrder ? "/sales-order" : "/delivery-note";
  const [loadingSalesOrder, setLoadingSalesOrder] = useState(!!salesOrder);
  const [form] = Form.useForm();

  const isSalesman = authService.getType() !== "พนักงานขาย";

  /** Modal handle */
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  // const [openQuotation, setOpenQuotation] = useState(false);

  /** Delivery-Note state */
  const [dnCode, setDNCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_DELIVERY);

  const [billingInfo, setBillingInfo] = useState(null);
  const [billingChecking, setBillingChecking] = useState(config?.action !== "create");
  const receiptLocked = billingChecking || !!billingInfo?.hasReceipt || ["ชำระเงินไม่ครบ", "ชำระเงินครบแล้ว", "ชำระเงินยังไม่ครบ", "ชำระครบแล้ว", "ยกเลิก"].includes(formDetail?.doc_status);

  const [unitOption, setUnitOption] = React.useState([]);
  const [itemOptions, setItemOptions] = React.useState([]);

  /* ---- เพิ่มรายการเพิ่มเติม: เลือกสินค้า แล้วเลือกว่าจะเพิ่มเข้าใบขายสินค้าใบไหน ---- */
  const [extraOpen, setExtraOpen] = useState(false);
  const [extra, setExtra] = useState({ stcode: null, qty: 1, unit: null, price: 0, socode: null });
  const [extraSoList, setExtraSoList] = useState([]);
  const [extraSoLoading, setExtraSoLoading] = useState(false);
  const extraMonth = dayjs(form.getFieldValue("dndate") || formDetail?.dndate || new Date());

  const openExtra = async () => {
    const currentSo = listDetail.find((r) => !r._new)?.socode || null;
    setExtra({ stcode: null, qty: 1, unit: null, price: 0, socode: currentSo });
    setExtraOpen(true);
    setExtraSoLoading(true);
    try {
      const r = await soservice.getbycus(`${encodeURIComponent(formDetail.cuscode)}&month=${extraMonth.format("YYYY-MM")}`, { ignoreLoading: true });
      setExtraSoList(r?.data?.data || []);
    } catch (e) {
      message.error("โหลดรายการใบขายสินค้าไม่สำเร็จ");
    } finally {
      setExtraSoLoading(false);
    }
  };

  /* ใบขายที่มีสินค้านี้อยู่แล้ว (ในใบขายเดิม หรือเพิ่มใหม่ค้างไว้ในใบส่งของนี้) เลือกไม่ได้ */
  const soHasItem = (so, stcode) => !!stcode && (
    String(so?.stcodes || "").split(",").includes(String(stcode)) ||
    listDetail.some((x) => x.socode === so?.socode && String(x.stcode) === String(stcode))
  );

  const addExtra = () => {
    if (!extra.stcode) return message.warning("กรุณาเลือกสินค้า");
    if (!(Number(extra.qty) > 0)) return message.warning("จำนวนต้องมากกว่า 0");
    if (!extra.unit) return message.warning("กรุณาเลือกหน่วย");
    if (!extra.socode) return message.warning("กรุณาเลือกใบขายสินค้าที่จะเพิ่มรายการนี้เข้าไป");
    if (soHasItem(extraSoList.find((x) => x.socode === extra.socode) || { socode: extra.socode }, extra.stcode)) {
      return message.warning(`ใบขายสินค้า ${extra.socode} มีสินค้านี้อยู่แล้ว — เลือกใบขายอื่น`);
    }
    const it = itemOptions.find((o) => o.value === extra.stcode);
    setListDetail((prev) => [...prev, {
      _new: true, code: `new-${Date.now()}`, socode: extra.socode, stcode: extra.stcode, stname: it?.stname || "",
      qty: Number(extra.qty), price: Number(extra.price || 0), unit: extra.unit,
    }]);
    setExtraOpen(false);
    message.success(`เพิ่ม ${it?.stname || extra.stcode} → ใบขายสินค้า ${extra.socode} แล้ว (กดบันทึกเพื่อยืนยัน)`);
  };

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await dnservice
          .get(config?.code)
          .catch((error) => message.error("get Delivery Note data fail."));
          const { header, detail } = res.data;          
        const { dncode, dndate } = header;
        
        setFormDetail(header);
        setListDetail(detail);
        setDNCode(dncode);
        form.setFieldsValue({
          ...header,
          dndate: dayjs(dndate),
        });

        // ตรวจสอบสถานะการออกใบวางบิล
        await checkBillingStatus(dncode);

        // console.log(dncode)
        // setTimeout( () => {  handleCalculatePrice(head?.valid_grand_total_price_until, head?.dated_grand_total_price_until) }, 200);
        // handleChoosedCustomers(head);
      } else {
        // เลขที่ใบส่งของใช้เลขเดียวกับใบขายสินค้า จะถูกกำหนดตอนเลือกใบขายสินค้า
        const ininteial_value = {
          ...formDetail,
          dncode: null,
          dndate: dayjs(new Date()),
          doc_status: "รอจัดเตรียมสินค้า",
        };
        // console.log(ininteial_value);
        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
        form.setFieldValue("vat", "7");
        if (salesOrder) {
          await handleChoosedSO([salesOrder], salesOrder.cuscode);
          setLoadingSalesOrder(false);
        }
      }

      const [unitOprionRes, itemRes] = await Promise.all([
        opservice.optionsUnit({ p: "unit-option" }),
        config?.action !== "create" ? opservice.optionsItems({ p: "items" }).catch(() => null) : null,
      ]);
      setItemOptions((itemRes?.data?.data || []).map((i) => ({ value: i.stcode, stname: i.stname, unit: i.unit, price: i.price, label: `${i.stcode} - ${i.stname}` })));
      // console.log(unitOprionRes.data.data)
      setUnitOption(unitOprionRes.data.data);
    };

    initial();
    return () => {};
  }, []);

  useEffect(() => {
    if (listDetail) handleSummaryPrice();
  }, [listDetail]);

  const handleSummaryPrice = () => {
    const newData = [...listDetail];

    const total_price = newData.reduce(
      (a, v) =>
        (a +=
          Number(v.qty || 0) *
          Number(v?.price || 0) ),
      0
    );

    setFormDetail((state) => ({
      ...state,
      total_price,
    }));
    // console.log(formDetail)
  };

  const checkBillingStatus = async (dncode) => {
    if (!dncode) return;
    setBillingChecking(true);
    
    try {
      const res = await blservice.checkBillingByDncode(dncode);

      const { data } = res.data;
      
      if (data && data.length > 0) {
        // หากเจอ billing note ที่ active และมี dncode นี้
        const billing = data[0]; // เอาใบแรกที่เจอ
        setBillingInfo({
          blcode: billing.blcode,
          hasBilling: true,
          hasReceipt: data.some((row) => Number(row.edit_locked) === 1)
        });
      } else {
        setBillingInfo(null);
      }
    } catch (error) {
      console.warn("Error checking billing status:", error);
      setBillingInfo({ hasReceipt: true });
      message.error("ตรวจสอบใบเสร็จไม่สำเร็จ กรุณาโหลดหน้าใหม่");
    } finally {
      setBillingChecking(false);
    }
  };
  const handleConfirm = () => {
    if (receiptLocked || loadingSalesOrder) return;
    form
      .validateFields()
      .then((v) => {
        if (listDetail.length < 1) throw new Error("กรุณาเพิ่ม รายการขาย");

        const header = {
          ...formDetail,
          dncode: dnCode,
          dndate: dayjs(form.getFieldValue("dndate")).format("YYYY-MM-DD"),
          remark: form.getFieldValue("remark"),
        };

        const detail = listDetail;
        // console.log(formDetail);
        const parm = { header, detail };
        // console.log(parm);

        const actions =
          config?.action !== "create" ? dnservice.update : dnservice.create;
        actions(parm)
          .then((r) => {
            const savedDocument = r?.data?.data?.document_code || r?.data?.data?.catalog_code;
            handleClose().then((r) => {
              message.success(savedDocument ? `บันทึกเอกสาร ${savedDocument} สำเร็จ` : ("Request Delivery Note success."));
            });
          })
          .catch((err) => {
            console.log(err);
            message.error(err.response.data.message);
          });
      })
      .catch((err) => {
        Modal.error({
          title: "ข้อมูลยังไม่ครบถ้วน",
          content: "คุณกรอกข้อมูล ไม่ครบถ้วน",
        });
      });
  };
  const handleCalculatePrice = (day, date) => {
    const newDateAfterAdding = dayjs(date || new Date()).add(
      Number(day),
      "day"
    );
    const nDateFormet = newDateAfterAdding.format("YYYY-MM-DD");

    setFormDetail((state) => ({
      ...state,
      dated_grand_total_price_until: nDateFormet,
    }));
    form.setFieldValue("dated_grand_total_price_until", nDateFormet);
  };

  const handleDNDate = (e) => {
    const { valid_grand_total_price_until } = form.getFieldsValue();
    if (!!valid_grand_total_price_until && !!e) {
      handleCalculatePrice(valid_grand_total_price_until || 0, e || new Date());
    }
  };

  /** Function modal handle */
  const handleChoosedCustomers = (val) => {
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
    const cusname = [
      !!val?.prename ? `${val.prename} ` : "",
      !!val?.cusname ? `${val.cusname} ` : "",
    ];
    const customers = {
      ...val,
      dncode: "",
      cusname: cusname.join(""),
      address: addr.join(""),
      contact: val.contact,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customers }));
    form.setFieldsValue({ ...fvalue, ...customers });
    setListDetail([]);
  };
  const handleChoosedSO = async (v, sourceCustomerCode) => {
    if (!v || v.length < 1) return;
    try {
      const [res, customerRes] = await Promise.all([
        dnservice.getdetail_for_issue({ detail: v }),
        sourceCustomerCode ? customerService.get(sourceCustomerCode) : null,
      ]);
      let { data } = res.data;
      if (sourceCustomerCode) {
        const customer = customerRes.data.header;
        if (!customer) throw new Error("ไม่พบข้อมูลลูกค้าของใบขายสินค้า");
        data = data
          .map((row) => ({ ...row, qty: Number(row.qty || 0) - Number(row.delamount || 0) }))
          .filter((row) => row.qty > 0);
        if (!data.length) throw new Error("ไม่พบรายการสินค้าคงเหลือสำหรับออกใบส่งของ");
        handleChoosedCustomers(customer);
      }
      setListDetail(data);
      // เลขที่ใบส่งของ = เลขใบขาย เปลี่ยนหน้าเป็น DN (IV6911017 -> DN6911017) ตรงกับที่ server สร้าง
      const socode = data?.[0]?.socode || v?.[0]?.socode || null;
      if (socode) {
        const dncode = `DN${String(socode).startsWith("IV") ? String(socode).slice(2) : socode}`;
        setDNCode(dncode);
        setFormDetail((state) => ({ ...state, dncode }));
      }
      // ตั้งต้นจากวันนัดส่งล่าสุดของใบขาย ผู้ใช้แก้วันที่ในฟอร์มได้ก่อนบันทึก
      if (config?.action === "create") {
        const deliveryDate = res.data.header?.deldate;
        const defaultDate = deliveryDate && !deliveryDate.startsWith("0000-") && dayjs(deliveryDate).isValid()
          ? dayjs(deliveryDate)
          : dayjs();
        setFormDetail((state) => ({ ...state, dndate: defaultDate }));
        form.setFieldValue("dndate", defaultDate);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "โหลดข้อมูลใบขายสินค้าไม่สำเร็จ");
      console.warn(err);
    }
  };
  /* ลบเฉพาะบรรทัดที่กด (เดิมลบทุกบรรทัดของใบขายเดียวกัน = ลบทั้งใบ) */
  const handleDelete = (record) => {
    setListDetail((prev) => {
      const idx = prev.indexOf(record);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return prev.filter((item) => !(item?.code === record?.code && item?.socode === record?.socode && item?.stcode === record?.stcode));
    });
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
        onClick={() => handleDelete(record)}
        disabled={receiptLocked}
      />
    ) : null;
  };

  const handleCancleDN = () => {
      Modal.confirm({
        title: (
          <Flex align="center" gap={2} className="text-red-700">
            <TbExclamationCircle style={{ fontSize: "1.5rem" }} />
            {"ยืนยันที่จะยกเลิกใบส่งสินค้า"}
          </Flex>
        ),
        icon: <></>,
        content: "ต้องการยกเลิกใบส่งสินค้า ใช่หรือไม่",
        okText: "ยืนยัน",
        okType: "danger",
        cancelText: "ยกเลิก",
        onOk() {
          dnservice
            .deleted(formDetail.dncode)
            .then((r) => {
              handleClose().then((r) => {
                message.success("ยกเลิกใบส่งสินค้าสำเร็จ");
              });
            })
            .catch((err) => {
              message.error("Request Delivery Note fail.");
              console.warn(err);
            });
          // setListSouce((state) => state.filter( soc => soc.stcode !== key));
        },
        // onCancel() { },
      });
    };

  const handleEditCell = (row) => {
    const newData = (r) => {
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      const ind = newData.findIndex((item) => r?.code === item?.code);
      if (ind < 0) return itemDetail;
      const item = newData[ind];
      newData.splice(ind, 1, {
        ...item,
        ...row,
      });

      handleSummaryPrice();
      return newData;
    };
    setListDetail([...newData(row)]);
  };

  /** setting column table */
  /* แก้รหัสสินค้าได้เฉพาะหน้าแก้ไข และยังไม่ตัดสต๊อก/ยังไม่ชำระเงิน */
  const canChangeItem = config?.action !== "create" && !receiptLocked && formDetail?.issue_status !== "ตัดสต๊อกแล้ว";
  const renderStcode = (v, rec) => rec?._new ? (
    <Flex vertical gap={2}><span>{v}</span><Tag color="gold" style={{ marginRight: 0 }}>เพิ่มใหม่ → {rec.socode}</Tag></Flex>
  ) : !canChangeItem ? v : (
    <Select
      size="small" showSearch style={{ width: "100%" }} value={v} optionFilterProp="label" popupMatchSelectWidth={false}
      options={itemOptions.length ? itemOptions : [{ value: v, label: `${v} - ${rec?.stname || ""}` }]}
      onChange={(code) => {
        const it = itemOptions.find((o) => o.value === code);
        handleEditCell({ ...rec, stcode: code, stname: it?.stname || rec.stname });
      }}
    />
  );
  const prodcolumns = columnsParametersEditable(handleEditCell, unitOption, {
    handleRemove,
    renderStcode,
  });

  const SectionCustomers = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
              rules={[{ required: true, message: "Missing Customer" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือกลูกค้า"
                  id="cuscode-1"
                  value={formDetail.cuscode}
                  className="!bg-white"
                />
                {config?.action !== "create" ? (
                  ""
                ) : (
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => setOpenCustomers(true)}
                    style={{ minWidth: 40 }}
                  ></Button>
                )}
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={18} lg={18}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input placeholder="ที่อยู่" readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item name="remark" label="อ้างอิง">
              <Input.TextArea placeholder="Enter Remark" rows={4} />
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
            รายการสินค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end" gap={8}>
          {canChangeItem && (
            <Button icon={<PlusOutlined />} onClick={openExtra} disabled={loadingSalesOrder || !formDetail?.cuscode}>
              เพิ่มรายการเพิ่มเติม
            </Button>
          )}
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenProduct(true);
            }}
            disabled={receiptLocked || loadingSalesOrder}
          >
            เลือกใบขายสินค้า
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTable}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listDetail}
          columns={prodcolumns}
          pagination={false}
          rowKey="code"
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
                        colSpan={6}
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
      </Flex>
    </>
  );
 
  const handleClose = async () => {
    navigate(gotoFrom, { replace: true });
    await delay(300);
    // console.clear();
  };
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
        {!billingInfo?.hasBilling &&
            config?.action !== "create" &&
            !isSalesman && (
              <Popconfirm
                placement="topRight"
                title="ยืนยันการยกเลิก"
                description="คุณแน่ใจที่จะยกเลิกใบส่งสินค้า?"
                icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                onConfirm={() => handleCancleDN()}
              >
                <Button
                  className="bn-center justify-center"
                  icon={<CloseCircleFilledIcon style={{ fontSize: "1rem" }} />}
                  type="primary"
                  style={{ width: "9.5rem" }}
                  danger
                >
                  ยกเลิกใบส่งสินค้า
                </Button>
              </Popconfirm>
            )}
          <Button
            className="bn-center justify-center"
            icon={<SaveFilled style={{ fontSize: "1rem" }} />}
            type="primary"
            style={{ width: "9.5rem", marginLeft: "10px" }}
            onClick={() => {
              handleConfirm();
            }}
            disabled={receiptLocked || loadingSalesOrder}
          >
            Save
          </Button>
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
      <Col span={12} className="p-0">
        <Flex gap={4} justify="end">
          <Button
            className="bn-center justify-center"
            icon={<SaveFilled style={{ fontSize: "1rem" }} />}
            type="primary"
            style={{ width: "9.5rem", marginLeft: "10px" }}
            onClick={() => {
              handleConfirm();
            }}
            disabled={receiptLocked || loadingSalesOrder}
          >
            Save
          </Button>
        </Flex>
      </Col>
    </Row>
  );

  return (
    <div className="dn-manage">
      <div id="dn-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {SectionTop}
          {!billingChecking && receiptLocked && <Alert type="warning" showIcon message="ไม่สามารถแก้ไขได้: เอกสารอยู่ในสถานะชำระเงินไม่ครบ ชำระครบแล้ว หรือยกเลิก" />}
          <Form
            form={form}
            layout="vertical"
            className="width-100"
            autoComplete="off"
            disabled={receiptLocked || loadingSalesOrder}
          >
            <Card
                      title={
                        <>
                          <AuditInfo data={formDetail} style={{ paddingTop: 8 }} />
<Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                              <Typography.Title level={3} className="m-0">
                                เลขที่ใบส่งสินค้า : {dnCode}
                              </Typography.Title>
                      <DocumentNumberPreview visible={config?.action === "create"} linked />
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                              <Flex
                                gap={10}
                                align="center"
                                className="justify-start sm:justify-end"
                              >
                                <Typography.Title level={3} className="m-0">
                                  วันที่ใบส่งสินค้า :{" "}
                                </Typography.Title>
                                <Form.Item name="dndate" className="!m-0">
                                  <DatePicker
                                    className="input-40"
                                    allowClear={false}
                                    onChange={handleDNDate}
                                    format={dateFormat}
                                  />
                                </Form.Item>
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
                            ข้อมูลใบส่งสินค้า{" "}
                          </Divider>
                          <Card style={cardStyle}>{SectionCustomers}</Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Tabs defaultActiveKey="1" items={[
                            { key: "1", label: "รายการใบส่งสินค้า", children: (
                              <Card style={{ backgroundColor: "#f0f0f0" }}>{SectionProduct}</Card>
                            ) },
                            ...(billingInfo?.hasBilling ? [{
                  key: "2",
                  label: "รายการรับชำระ",
                  children: (
                    <Card>
                      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        <Typography.Title level={4}>
                          ใบวางบิล: <DocumentLink type="blcode" code={billingInfo.blcode} />
                        </Typography.Title>
                        <Button
                          type="primary"
                          onClick={() => navigate(`/billing/manage/edit`, { state: { config: { code: billingInfo.blcode, action: 'edit' } } })}
                        >
                          ไปยังใบวางบิล
                        </Button>
                      </Space>
                    </Card>
                  ),
                }] : [])
                          ]} />
                        </Col>
                      </Row>
                    </Card>
          </Form>
          {SectionBottom}
        </Space>
      </div>

      {openCustomers && (
        <ModalCustomers
          show={openCustomers}
          close={() => setOpenCustomers(false)}
          values={(v) => {
            handleChoosedCustomers(v);
          }}
          fetchOptions={config?.action === "create" ? opservice.optionsCustomerPendingDN : undefined}
          showPendingSO={config?.action === "create"}
        ></ModalCustomers>
      )}

      {openProduct && (
        <ModalSO
          show={openProduct}
          close={() => setOpenProduct(false)}
          cuscode={form.getFieldValue("cuscode")}
          values={(v) => {
            handleChoosedSO(v);
          }}
          selected={listDetail}
        ></ModalSO>
      )}
      <Modal open={extraOpen} title="เพิ่มรายการเพิ่มเติม" onCancel={() => setExtraOpen(false)} onOk={addExtra}
        okText="เพิ่มรายการ" cancelText="ยกเลิก" width={1100} style={{ top: 40 }} destroyOnClose>
        <Row gutter={[12, 12]}>
          <Col xs={24}>
            <Typography.Text type="secondary">สินค้า</Typography.Text>
            <Select showSearch style={{ width: "100%" }} placeholder="ค้นหารหัส / ชื่อสินค้า" optionFilterProp="label"
              value={extra.stcode} options={itemOptions}
              onChange={(code) => {
                const it = itemOptions.find((o) => o.value === code);
                setExtra((e) => {
                  const cur = extraSoList.find((x) => x.socode === e.socode);
                  return { ...e, stcode: code, unit: it?.unit || e.unit, price: Number(it?.price || 0),
                    socode: cur && soHasItem(cur, code) ? null : e.socode };
                });
              }} />
          </Col>
          <Col xs={8}>
            <Typography.Text type="secondary">จำนวน</Typography.Text>
            <InputNumber style={{ width: "100%" }} min={0} value={extra.qty} onChange={(v) => setExtra((e) => ({ ...e, qty: v }))} />
          </Col>
          <Col xs={8}>
            <Typography.Text type="secondary">หน่วย</Typography.Text>
            <Select style={{ width: "100%" }} value={extra.unit} showSearch optionFilterProp="label"
              options={(unitOption || []).map((u) => ({ value: u.value ?? u.unit ?? u.label, label: u.label ?? u.unit ?? u.value }))}
              onChange={(v) => setExtra((e) => ({ ...e, unit: v }))} />
          </Col>
          <Col xs={8}>
            <Typography.Text type="secondary">ราคาต่อหน่วย</Typography.Text>
            <InputNumber style={{ width: "100%" }} min={0} precision={2} value={extra.price} onChange={(v) => setExtra((e) => ({ ...e, price: v }))} />
          </Col>
          <Col xs={24}>
            <Divider orientation="left" className="!my-2">
              รายการนี้จะไปอยู่ใบขายสินค้าใบไหน? (ลูกค้า {formDetail?.cuscode} · เดือน {extraMonth.format("MM/YYYY")})
            </Divider>
            <Table size="small" rowKey="socode" loading={extraSoLoading} dataSource={extraSoList} pagination={false} scroll={{ y: 380 }}
              locale={{ emptyText: "ไม่มีใบขายสินค้าของลูกค้านี้ในเดือนนี้" }}
              rowClassName={(r) => (soHasItem(r, extra.stcode) ? "opacity-50" : "")}
              onRow={(r) => ({
                onClick: () => { if (!soHasItem(r, extra.stcode)) setExtra((e) => ({ ...e, socode: r.socode })); },
                style: { cursor: soHasItem(r, extra.stcode) ? "not-allowed" : "pointer" },
              })}
              columns={[
                { title: "", key: "pick", width: 40, render: (_, r) => <Radio checked={extra.socode === r.socode} disabled={soHasItem(r, extra.stcode)} /> },
                { title: "เลขที่ใบขายสินค้า", dataIndex: "socode", width: 340, render: (v, r) => (
                  <Space size={4} wrap>{v}
                    {listDetail.some((x) => !x._new && x.socode === v) && <Tag color="blue">ใบขายของใบส่งของนี้</Tag>}
                    {soHasItem(r, extra.stcode) && <Tag color="red">มีสินค้านี้แล้ว</Tag>}
                  </Space>) },
                { title: "วันที่", dataIndex: "sodate", width: 110, render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-") },
                { title: "วันนัดส่ง", dataIndex: "deldate", width: 110, render: (v) => (v && !String(v).startsWith("0000") ? dayjs(v).format("DD/MM/YYYY") : "-") },
                { title: "สถานะ", dataIndex: "doc_status", width: 150 },
                { title: "ยอดรวม", dataIndex: "total_price", width: 110, align: "right", render: (v) => comma(Number(v || 0)) },
              ]} />
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

export default DeliveryNoteManage;
