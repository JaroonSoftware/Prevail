import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Flex,
  Col,
  Button,
  message,
  Drawer,
  Collapse,
  Form,
  Row,
  Space,
  DatePicker,
} from "antd";
import { BsUiChecks } from "react-icons/bs";
import {
  ReloadOutlined,
  EditOutlined,
  SearchOutlined,
  ClearOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { GiGrain } from "react-icons/gi";
import dayjs from "dayjs";

import { columns } from "./model";
import DryCheckDrawer from "../../../components/drawer/dry-check/DryCheckDrawer";
import ReportService from "../../../service/Report.service";
import {
  saveMyAccessSearchCookie,
  loadMyAccessSearchCookie,
  clearMyAccessSearchCookie,
} from "../../../utils/myaccessSearchCookie";

const rpservice = ReportService();
const RangePicker = DatePicker.RangePicker;

const DryGoodsSelector = () => {
  const PAGE_COOKIE_KEY = "dry-report";
  const [form] = Form.useForm();
  const [listDetail, setListDetail] = useState([]);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeSearch, setActiveSearch] = useState([]);
  const isFirstLoadRef = useRef(true);

  const getIgnoreLoading = () => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  };

  const getData = useCallback((data) => {
    rpservice
      .getDryGoods(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;

        setListDetail(data);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  }, []);

  const buildSearchPayload = useCallback((values = {}) => {
    const data = { ...values };
    if (!!data?.sodate) {
      const arr = data?.sodate.map((m) => dayjs(m).format("YYYY-MM-DD"));
      const [sodate_form, sodate_to] = arr;
      Object.assign(data, { sodate_form, sodate_to });
    }
    delete data.sodate;
    return data;
  }, []);

  const savePageState = useCallback((searchValues) => {
    saveMyAccessSearchCookie(
      PAGE_COOKIE_KEY,
      {
        searchValues,
      },
      7
    );
  }, [PAGE_COOKIE_KEY]);

  const handleSearch = useCallback((forcedValues = null) => {
    const values = forcedValues ?? form.getFieldsValue(true);
    savePageState(values);
    const payload = buildSearchPayload(values);

    getData(payload);
  }, [buildSearchPayload, form, getData, savePageState]);

  const handleClear = useCallback(() => {
    clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
    form.resetFields();
    handleSearch({});
  }, [PAGE_COOKIE_KEY, form, handleSearch]);

  const init = useCallback(async () => {
    const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY);

    if (restored?.searchValues) {
      form.setFieldsValue(restored.searchValues);
      return restored.searchValues;
    }

    return {};
  }, [PAGE_COOKIE_KEY, form]);

  useEffect(() => {
    (async () => {
      const restoredSearchValues = await init();
      handleSearch(restoredSearchValues);
    })();

    return async () => {
      //console.clear();
    };
  }, [handleSearch, init]);

  const FormSearch = (
    <Collapse
      size="small"
      bordered={false}
      activeKey={activeSearch}
      onChange={(keys) => setActiveSearch(keys)}
      items={[
        {
          key: "1",
          label: (
            <>
              <SearchOutlined />
              <span> ค้นหา</span>
            </>
          ),
          showArrow: false,
          children: (
            <>
              <br />
              <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                onValuesChange={(changedValues) => {
                  if (Object.prototype.hasOwnProperty.call(changedValues, "sodate")) {
                    handleSearch();
                  }
                }}
              >
                <Row gutter={[8, 8]}>
                  {/* <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Form.Item label="เลขที่ SO" name="socode">
                      <Input placeholder="Enter SO Code" />
                    </Form.Item>
                  </Col> */}
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Form.Item label="วันที่เอกสาร" name="sodate">
                      <RangePicker
                        placeholder={["From Date", "To Date"]}
                        style={{ width: "100%", height: 40 }}
                      />
                    </Form.Item>
                  </Col>
                  {/* <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.Item label="รหัสลูกค้า" name="cuscode">
                      <Input placeholder="Enter Customer Code" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.Item label="ชื่อลูกค้า" name="cusname">
                      <Input placeholder="Enter Customer Name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.Item label="ผู้จัดทำ" name="created_by">
                      <Input placeholder="Enter Creator Name" />
                    </Form.Item>
                  </Col> */}
                </Row>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {/* Ignore */}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Flex justify="flex-end" gap={8}>
                      <Button
                        type="primary"
                        size="small"
                        className="bn-action"
                        icon={<SearchOutlined />}
                        onClick={() => handleSearch()}
                      >
                        ค้นหา
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        className="bn-action"
                        danger
                        icon={<ClearOutlined />}
                        onClick={() => handleClear()}
                      >
                        ล้าง
                      </Button>
                    </Flex>
                  </Col>
                </Row>
              </Form>
            </>
          ),
        },
      ]}
    />
  );

  const handleOpen = useCallback((value) => {
    setSelected(value);
    setShow(true);
  }, []);

  const handleConfirmed = useCallback((v) => {
    rpservice
      .setDryGoods(v, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        message.success(res.data.message || "บันทึกข้อมูลเรียบร้อย");
        getData({});
        setShow(false);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  }, [getData]);

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <GiGrain
                style={{ fontSize: "1.4rem", verticalAlign: "middle" }}
              />
              <span>รายการของแห้งสำหรับคนซื้อ</span>
            </span>
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            size="small"
            className="bn-action bn-center bn-primary justify-center"
            icon={<ReloadOutlined style={{ fontSize: ".9rem" }} />}
            onClick={() => handleSearch()}
          >
            Refresh
          </Button>
          <Button
            size="small"
            className="bn-action bn-center bn-primary-outline justify-center"
            icon={<PrinterOutlined style={{ fontSize: ".9rem" }} />}
            onClick={() => {
            const url = `${window.location.origin}/dry-report-print`;
            const newWindow = window.open('', url, url);
            newWindow.location.href = url;
            }}
          >
            Print Report
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  // ปุ่มเช็คลิสต์สำเร็จ ในคอลัมน์ "ตัวเลือก"
  const handleCheck = useCallback((record) => {
    return (
      <Button
        className="bt-icon bn-success-outline"
        icon={
          <BsUiChecks
            style={{ fontSize: "1.4rem", marginTop: "4px", marginLeft: "1px" }}
          />
        }
        aria-label="ทำรายการสำเร็จ"
        title="ทำรายการสำเร็จ"
        onClick={() => handleOpen(record)}
      />
    );
  }, [handleOpen]);

  const handleSelectChange = useCallback(() => {}, []);

  // สร้างคอลัมน์จาก model (ต้องส่ง handleCheck ให้ตรงชื่อ)
  const columnDefs = useMemo(
    () => columns({ handleCheck, handleSelectChange }),
    [handleCheck, handleSelectChange]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "16px 12px",
        boxSizing: "border-box",
      }}
    >
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", width: "100%", maxWidth: 1024 }}
      >
        {FormSearch}
        <Card
          title={TitleTable}
          style={{
            width: "100%",
            borderRadius: 12,
          }}
          bodyStyle={{ padding: 12 }}
        >
          <Table
            size="small"
            rowKey="key"
            columns={columnDefs}
            dataSource={listDetail}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "ไม่มีรายการ" }}
          />
        </Card>
      </Space>
      {!!show && (
        <Drawer
          title={
            <Flex align="center" gap={4}>
              ยืนยันการสั่งซื้อ <EditOutlined style={{ fontSize: "1.2rem" }} />
            </Flex>
          }
          onClose={() => setShow(false)}
          open={show}
          // footer={adjust_action}
          width={868}
          className="responsive-drawer"
          styles={{
            body: { paddingBlock: 8, paddingLeft: 18, paddingRight: 8 },
          }}
        >
          {show && (
            <DryCheckDrawer
              data={selected}
              submit={handleConfirmed}
              close={() => setShow(false)}
            />
          )}
        </Drawer>
      )}
    </div>
  );
};

export default DryGoodsSelector;
