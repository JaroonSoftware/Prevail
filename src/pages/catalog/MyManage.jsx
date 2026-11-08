import DocumentNumberPreview from "../../components/DocumentNumberPreview";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Typography, message, InputNumber } from "antd";
import {
  Card,
  Col,
  Flex,
  Row,
  Space,
  Input,
  Divider,
  Select,
  Badge,
  DatePicker,
  Collapse,
  Tabs,
} from "antd";
import OptionService from "../../service/Options.service";
import CatalogService from "../../service/Catalog.Service";
import {
  SaveFilled,
  CaretRightOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  columnsParametersEditable,
  componentsEditable,
  columnsParametersEditableCustomer,
} from "./model";
import { ModalItems } from "../../components/modal/items/modal-items";
import { ModalCusCL } from "../../components/modal/customerbyCL/modal-cusCL";
import { delay } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackageSearch } from "react-icons/lu";
import dayjs from "dayjs";
const clservice = CatalogService();
const opservice = OptionService();
/* แท็บสำหรับสินค้าที่ยังไม่ได้ตั้งหมวดในหน้าข้อมูลสินค้า */
const NO_GROUP = "none";
/* แท็บรายการจากไฟล์ราคาที่ยังไม่มีสินค้าในระบบ (ตาราง catalog_pending) */
const PENDING_TAB = "pending";
const gotoFrom = "/catalog";

const cardStyle = {
  backgroundColor: "#f0f0f0",
  height: "calc(100% - (25.4px + 1rem))",
};
const RangePicker = DatePicker.RangePicker;

function CatalogManage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config, prefill } = location.state || { config: null, prefill: null };
  const isEditMode = config?.action === "edit";
  const [form] = Form.useForm();
  /** Modal handle */
  const [openCustomerCL, setOpenCustomerCL] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  /** Catalog state */
  const [clCode, setCLCode] = useState(null);
  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);
  const [listCustomer, setCusDetail] = useState([]);
  const [formDetail, setFormDetail] = useState([]);
  /** หมวดแคตตาล็อก (แบ่งแท็บตามไฟล์ราคา Q4) */
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [tabSearch, setTabSearch] = useState("");
  /** รายการรอสร้างสินค้า + สินค้าทั้งหมดไว้ให้เลือกจับคู่ */
  const [listPending, setListPending] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [pendingPick, setPendingPick] = useState({});
  const loadAllItems = () =>
    opservice.optionsItems({ p: "items" }).then((r) => setAllItems(r?.data?.data || [])).catch(() => {});
  useEffect(() => {
    const initial = async () => {
      if (config?.action === "create") {
        const codeResponse = await clservice.getcode().catch((e) => {
          message.error("get Catalog code fail.");
        });
        const code = codeResponse?.data?.data;
        if (!code) return;

        setCLCode(code);
        const initialValue = {
          ...formDetail,
          catalog_code: code,
        };

        /* มาจากหน้านำเข้า Excel (AI): เติมชื่อ ช่วงวันที่ และรายการสินค้าให้ */
        if (prefill) {
          initialValue.catalog_name = prefill.catalog_name;
          if (prefill.start_date && prefill.stop_date) {
            initialValue.catalog_date = [dayjs(prefill.start_date), dayjs(prefill.stop_date)];
          }
          setListDetail(prefill.detail || []);
          setListPending((prefill.pending || []).map((p, i) => ({ ...p, _pid: i + 1 })));
        }

        setFormDetail(initialValue);
        form.setFieldsValue(initialValue);
        return;
      }

      const res = await clservice
        .get(config?.code)
        .catch((error) => message.error("get Catalog data fail."));
      if (!res?.data?.data) return;

      const {
        data: { header, detail, customer, pending },
      } = res.data;
      setListPending((pending || []).map((p, i) => ({ ...p, _pid: i + 1 })));
      const nextHeader = { ...header };

      if (!isEditMode) {
        const codeResponse = await clservice.getcode().catch((e) => {
          message.error("get Catalog code fail.");
        });
        const nextCode = codeResponse?.data?.data;
        if (!nextCode) return;

        nextHeader.catalog_code = nextCode;
        setCLCode(nextCode);
      } else {
        setCLCode(header.catalog_code);
      }

      const { catalog_name, start_date, stop_date, remark } = nextHeader;
      setFormDetail(nextHeader);
      setListDetail(detail || []);
      setCusDetail(customer || []);

      let tmpdate = [];
      if (!!start_date) tmpdate = [dayjs(start_date), dayjs(stop_date)];
      form.setFieldsValue({
        ...nextHeader,
        catalog_name,
        catalog_date: tmpdate,
        remark,
      });
      // console.log(unitOprionRes.data.data)
    };

    opservice
      .optionsCatalogGroup()
      .then((r) => {
        const g = r?.data?.data || [];
        setGroups(g);
        setActiveTab((t) => t ?? (g.length ? String(g[0].group_id) : NO_GROUP));
      })
      .catch(() => setActiveTab(NO_GROUP));

    initial();
    return () => {};
  }, []);

  useEffect(() => {
    if (listDetail);
  }, [listDetail]);

  /** Function modal handle */
  const handleChoosedCustomer = (value) => {
    // console.log(value);
    setCusDetail(value);
  };

  const groupKeyOf = (it) => (it?.catalog_group_id ? String(it.catalog_group_id) : NO_GROUP);

  const handleItemsChoosed = (value) => {
    /* เพิ่มจากโหมด "แสดงสินค้าทั้งหมด" สินค้าจะไปอยู่ในแท็บหมวดของตัวเอง แจ้งให้รู้ */
    const before = new Set(listDetail.map((d) => d.stcode));
    const added = value.filter((v) => !before.has(v.stcode));
    const other = added.filter((v) => groupKeyOf(v) !== activeTab).length;
    if (other > 0) message.info(`${other} รายการที่เพิ่ม อยู่ในแท็บหมวดอื่น (ตามหมวดที่ตั้งไว้ในข้อมูลสินค้า)`);
    setListDetail(value);
  };

  const handleConfirm = () => {
    form
      .validateFields()
      .then((v) => {
        // if (listDetail.length < 1)
        //   throw new Error("กรุณาเพิ่มข้อมูลให้ถูกต้อง");
        // if (listCustomer.length < 1)
        //   throw new Error("กรุณาเพิ่มข้อมูลให้ถูกต้อง");
        const data = { ...v };

        if (!!data?.catalog_date) {
          const arr = data?.catalog_date.map((m) =>
            dayjs(m).format("YYYY-MM-DD")
          );
          const [start_date, stop_date] = arr;
          //data.created_date = arr
          Object.assign(data, { start_date, stop_date });
        }

        const header = {
          catalog_code: clCode,
          catalog_name: form.getFieldValue("catalog_name"),
          remark: form.getFieldValue("remark"),
          active_status: form.getFieldValue("active_status"),
          start_date: data.start_date,
          stop_date: data.stop_date,
        };

        const staleUnit = listDetail.some(d => listCustomer.some(c => d.customer_packing?.[c.cuscode] != null && d.customer_packing_units?.[c.cuscode] && d.customer_packing_units[c.cuscode] !== d.unit));
        if (staleUnit) throw new Error("กรุณาตั้งขนาดถุงใหม่ให้ตรงหน่วยสินค้า");
        const detail = listDetail;
        const customer = listCustomer;
        const pending = listPending.map(({ _pid, pending_id, ...p }) => p);
        const parm = { header, detail, customer, pending };
        // console.log(parm);
        const actions = isEditMode ? clservice.update : clservice.create;
        actions(parm)
          .then((r) => {
            const savedDocument = r?.data?.data?.document_code || r?.data?.data?.catalog_code;
            handleClose().then((r) => {
              message.success(savedDocument ? `บันทึกเอกสาร ${savedDocument} สำเร็จ` : "แก้ไข Catalog สำเร็จ");
            });
          })
          .catch((err) => {
            message.error(err?.response?.data?.message || "Request Catalog fail.");
            console.warn(err);
          });
      })
      .catch((err) => {
        message.error('คุณกรอกข้อมูล ไม่ครบถ้วน');
      });
  };

  const handleClose = async () => {
    navigate(gotoFrom, { replace: true });
    await delay(300);
    console.clear();
  };

  const handleDuplicate = () => {
    if (!config?.code) return;

    navigate(`${gotoFrom}/manage/duplicate`, {
      state: {
        config: {
          action: "duplicate",
          code: config.code,
          title: "ทำสำเนาแคตตาล๊อก",
        },
      },
    });
  };

  const handleDelete = (code) => {
    const itemDetail = [...listDetail];
    const newData = itemDetail.filter((item) => item?.stcode !== code);
    setListDetail([...newData]);
  };
  const handleDeleteCustomer = (code) => {
    const CustomerDetail = [...listCustomer];
    const newData = CustomerDetail.filter((customer) => customer?.cuscode !== code);
    setCusDetail([...newData]);
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
        onClick={() => handleDelete(record?.stcode)}
        disabled={!record?.stcode}
      />
    ) : null;
  };
  const handleRemoveCustomer = (record) => {
    const CustomerDetail = [...listCustomer];
    return CustomerDetail.length >= 1 ? (
      <Button
        className="bt-icon"
        size="small"
        danger
        icon={
          <RiDeleteBin5Line style={{ fontSize: "1rem", marginTop: "3px" }} />
        }
        onClick={() => handleDeleteCustomer(record?.cuscode)}
        disabled={!record?.cuscode}
      />
    ) : null;
  };
  const handleEditCell = (row) => {
    const newData = (r) => {
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      const ind = newData.findIndex((item) => r?.stcode === item?.stcode);
      if (ind < 0) return itemDetail;
      const item = newData[ind];
      newData.splice(ind, 1, {
        ...item,
        ...row,
      });
      return newData;
    };
    setListDetail([...newData(row)]);
  };
  const handleEditCellCustomer = (row) => {
    const newData = (r) => {
      const CustomerDetail = [...listCustomer];
      const newData = [...CustomerDetail];

      const ind = newData.findIndex(
        (customer) => r?.cuscode === customer?.cuscode
      );
      if (ind < 0) return CustomerDetail;
      const customer = newData[ind];
      newData.splice(ind, 1, {
        ...customer,
        ...row,
      });
      return newData;
    };
    setCusDetail([...newData(row)]);
  };

  /** setting column table */
  const cuscolumns = columnsParametersEditableCustomer(
    handleEditCellCustomer,
    { handleRemoveCustomer }
  );
  const prodcolumns = columnsParametersEditable(handleEditCell,{
    handleRemove,
  });
  const operationColumnIndex = prodcolumns.findIndex(column => column.key === "operation");
  prodcolumns.splice(operationColumnIndex < 0 ? prodcolumns.length : operationColumnIndex, 0, { title: "ขนาดบรรจุต่อถุงแยกตามลูกค้า", key: "customer_packing", width: 320,
    render: (_, row) => <Space direction="vertical">
      <Typography.Text type="secondary">ค่ากลาง: {row.packing_weight || "-"} {row.unit}/ถุง · เว้นว่างเพื่อใช้ค่ากลาง</Typography.Text>
      {listCustomer.map(c => <Space key={c.cuscode}>
        <InputNumber aria-label={`ขนาดถุง ${c.cuscode} ${row.stcode}`} min={0.01} max={9999999.99} precision={2}
          value={row.customer_packing?.[c.cuscode] ?? null}
          onChange={v => handleEditCell({...row, customer_packing: {...row.customer_packing, [c.cuscode]: v},
            customer_packing_units: {...row.customer_packing_units, [c.cuscode]: row.unit}})} />
        <span>{row.unit}/ถุง</span>
        {row.customer_packing_units?.[c.cuscode] && row.customer_packing_units[c.cuscode] !== row.unit &&
          <Typography.Text type="danger">หน่วยเดิม {row.customer_packing_units[c.cuscode]} กรุณาตั้งค่าใหม่</Typography.Text>}
      </Space>)}
    </Space>
  });
  const TitleTableCustomer = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายชื่อลูกค้า
          </Typography.Title>
        </Flex>
      </Col>

      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenCustomerCL(true);
            }}
          >
            เลือกลูกค้า
          </Button>
        </Flex>
      </Col>
    </Flex>
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
        <Flex justify="end">
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenProduct(true);
            }}
          >
            เพิ่มสินค้าในหมวดนี้
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  const countByTab = listDetail.reduce((a, d) => ({ ...a, [groupKeyOf(d)]: (a[groupKeyOf(d)] || 0) + 1 }), {});
  const tabItems = [
    ...groups.map((g) => ({ key: String(g.group_id), name: g.group_name })),
    { key: NO_GROUP, name: "ยังไม่จัดหมวด" },
    ...(listPending.length ? [{ key: PENDING_TAB, name: "⚠ รอสร้างสินค้า" }] : []),
  ].map((t) => ({
    key: t.key,
    label: (
      <span>
        {t.name} <Badge count={t.key === PENDING_TAB ? listPending.length : countByTab[t.key] || 0} showZero color={t.key === PENDING_TAB ? "#faad14" : countByTab[t.key] ? "#1677ff" : "#d9d9d9"} size="small" />
      </span>
    ),
  }));

  const SectionDetail = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={10} md={10} lg={10} xl={10}>
            <Form.Item
              name="catalog_name"
              label="ชื่อแคตตาล๊อก"
              className="!mb-1"
            >
              <Input placeholder="ชื่อแคตตาล๊อก" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8} md={8} lg={8} xl={8}>
            <Form.Item label="วันที่ใช้งาน" name="catalog_date" rules={[{ required: true, message: "โปรดระบุช่วงวันที่ใช้งาน" }]}>
              <RangePicker
                placeholder={["From Date", "To date"]}
                style={{ width: "100%", height: 40 }}                
              />
            </Form.Item>
          </Col>
          <Col
            xs={24}
            sm={6}
            md={6}
            lg={6}
            xl={6}
            style={isEditMode ? { display: "inline" } : { display: "none" }}
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
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item className="!mb-1" name="remark" label="หมายเหตุ">
              <Input placeholder="หมายเหตุ" />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );
  const SectionCustomer = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTableCustomer}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listCustomer}
          columns={cuscolumns}
          pagination={false}
          rowKey="cuscode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
        />
      </Flex>
    </>
  );
  /* จับคู่รายการรอสร้างสินค้ากับสินค้าที่สร้างแล้ว -> ย้ายเข้าแคตตาล็อก */
  const handleMatchPending = (p) => {
    const it = allItems.find((i) => i.stcode === pendingPick[p._pid]);
    if (!it) return message.warning("กรุณาเลือกสินค้า");
    if (listDetail.some((d) => d.stcode === it.stcode)) return message.warning(`สินค้า ${it.stname} มีในแคตตาล็อกแล้ว`);
    setListDetail((s) => [...s, {
      stcode: it.stcode, stname: it.stname, unit: it.unit, packing_weight: it.packing_weight, customer_packing: {},
      price: p.price != null ? Number(p.price) : Number(it.price || 0),
      catalog_group_id: it.catalog_group_id ?? null,
    }]);
    setListPending((s) => s.filter((x) => x._pid !== p._pid));
    message.success(`ย้าย ${it.stname} เข้าแคตตาล็อกแล้ว (กด Save เพื่อบันทึก)`);
  };

  const SectionPending = (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Typography.Text type="warning">
          รายการจากไฟล์ราคาที่ยังไม่มีสินค้าในระบบ — สร้างสินค้าในหน้าข้อมูลสินค้าก่อน แล้วกลับมาเลือกจับคู่ (ยังไม่ถูกใช้ในใบขายสินค้า)
        </Typography.Text>
        <Space>
          <Button onClick={() => window.open("/items", "_blank")}>เปิดหน้าข้อมูลสินค้า (แท็บใหม่)</Button>
          <Button onClick={loadAllItems}>โหลดรายการสินค้าใหม่</Button>
        </Space>
      </Flex>
      <Table size="small" bordered rowKey="_pid" pagination={false} scroll={{ x: "max-content" }}
        dataSource={listPending.filter((p) => !tabSearch || p.raw_name?.includes(tabSearch) || p.name_en?.toLowerCase().includes(tabSearch.toLowerCase()))}
        columns={[
          { title: "ลำดับ", key: "i", width: 60, render: (_, __, i) => i + 1 },
          { title: "ชื่อในไฟล์", key: "n", render: (_, p) => <>{p.raw_name}{p.name_en && <div style={{ color: "#8c8c8c", fontSize: 12 }}>{p.name_en}</div>}</> },
          { title: "หน่วย", dataIndex: "unit", width: 80 },
          { title: "ราคา", dataIndex: "price", width: 90, align: "right", render: (v) => (v == null ? "-" : Number(v).toFixed(2)) },
          { title: "หมวดในไฟล์", dataIndex: "group_name", width: 140 },
          { title: "ไฟล์", dataIndex: "source_file", width: 160, render: (v, p) => <span style={{ fontSize: 12 }}>{v}{p.cust_code && <><br />รหัสลูกค้า {p.cust_code}</>}</span> },
          { title: "จับคู่กับสินค้าที่สร้างแล้ว", key: "pick", width: 300,
            render: (_, p) => (
              <Select size="small" showSearch allowClear style={{ width: "100%" }} placeholder="เลือกสินค้า"
                onDropdownVisibleChange={(o) => o && !allItems.length && loadAllItems()}
                options={allItems.map((i) => ({ value: i.stcode, label: `${i.stname} (${i.stcode})` }))}
                optionFilterProp="label" value={pendingPick[p._pid]}
                onChange={(v) => setPendingPick((s) => ({ ...s, [p._pid]: v }))} />
            ) },
          { title: "", key: "act", width: 130,
            render: (_, p) => (
              <Space size={4}>
                <Button size="small" type="primary" onClick={() => handleMatchPending(p)}>ย้ายเข้า</Button>
                <Button size="small" danger onClick={() => setListPending((s) => s.filter((x) => x._pid !== p._pid))}>ลบ</Button>
              </Space>
            ) },
        ]}
      />
    </Space>
  );

  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Tabs
          activeKey={activeTab || undefined}
          onChange={(k) => { setActiveTab(k); setTabSearch(""); }}
          items={tabItems}
          className="!mb-0"
        />
        <Input
          allowClear
          placeholder="ค้นหาในหมวดนี้"
          value={tabSearch}
          onChange={(e) => setTabSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {activeTab === PENDING_TAB ? SectionPending : (
        <Table
          title={() => TitleTable}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listDetail.filter(
            (d) => groupKeyOf(d) === activeTab && (!tabSearch || d.stname?.includes(tabSearch) || d.stcode?.includes(tabSearch))
          )}
          columns={prodcolumns}
          pagination={false}
          rowKey="stcode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
        />
        )}
      </Flex>
    </>
  );

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
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          {isEditMode && (
            <Button
              className="bn-center justify-center bn-primary-outline"
              icon={<CopyOutlined style={{ fontSize: "1rem" }} />}
              style={{ width: "9.5rem" }}
              onClick={handleDuplicate}
            >
              Copy
            </Button>
          )}
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
          {isEditMode && (
            <Button
              className="bn-center justify-center bn-primary-outline"
              icon={<CopyOutlined style={{ fontSize: "1rem" }} />}
              style={{ width: "9.5rem" }}
              onClick={handleDuplicate}
            >
              Copy
            </Button>
          )}
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
        </Flex>
      </Col>
    </Row>
  );
  const collapetablecustomer = [
    {
      key: "1",
      label: "รายชื่อลูกค้าที่ใช้แคตตาล๊อก",
      children: (
        <Row className="m-0" gutter={[12, 12]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            {SectionCustomer}
          </Col>
        </Row>
      ),
    },
  ];
  const collapetableitems = [
    {
      key: "1",
      label: "รายการสินค้าในแคตตาล๊อก",
      children: (
        <Row className="m-0" gutter={[12, 12]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            {SectionProduct}
          </Col>
        </Row>
      ),
    },
  ];
  return (
    <div className="catalog-manage">
      <div id="catalog-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {SectionTop}
          <Form
            form={form}
            layout="vertical"
            className="width-100"
            autoComplete="off"
          >
            <Card
              title={
                <>
                  <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                    <Col xs={24} sm={24} md={16} lg={16} xl={16} xxl={16}>
                      <Typography.Title level={3} className="m-0">
                        รหัสแคตตาล๊อก : {clCode}
                      </Typography.Title>
                      <DocumentNumberPreview visible={!isEditMode} />
                    </Col>
                  </Row>
                </>
              }
            >
              <Row className="m-0" gutter={[12, 12]}>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Card style={cardStyle}>{SectionDetail}</Card>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    รายการแคตตาล็อก
                  </Divider>
                </Col>
              </Row>

              <Collapse
                items={collapetablecustomer}
                bordered={false}
                defaultActiveKey={["1"]}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
              />
              <br></br>
              <Collapse
                items={collapetableitems}
                bordered={false}
                defaultActiveKey={["1"]}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
              />
            </Card>
          </Form>
          {SectionBottom}
        </Space>
      </div>
      {openCustomerCL && (
        <ModalCusCL
          show={openCustomerCL}
          close={() => setOpenCustomerCL(false)}
          values={(v) => {
            handleChoosedCustomer(v);
          }}
          selected={listCustomer}
        ></ModalCusCL>
      )}
      {openProduct && (
        <ModalItems
          show={openProduct}
          close={() => setOpenProduct(false)}
          values={(v) => {
            handleItemsChoosed(v);
          }}
          selected={listDetail}
          groups={groups}
          groupId={activeTab === NO_GROUP ? null : activeTab}
        ></ModalItems>
      )}
    </div>
  );
}

export default CatalogManage;
