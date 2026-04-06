import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Flex,
  Button,
  message,
  Form,
  Space,
  DatePicker,
  Radio,
  Empty,
} from "antd";
import {
  TeamOutlined,
  SearchOutlined,
  ClearOutlined,
  PrinterOutlined,
} from "@ant-design/icons";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import {
  saveMyAccessSearchCookie,
  loadMyAccessSearchCookie,
  clearMyAccessSearchCookie,
} from "../../../utils/myaccessSearchCookie";
import {
  PAGE_COOKIE_KEY,
  CUSTOMER_REPORT_MODE,
  formatThaiDate,
  buildSearchPayload,
  buildCustomerSummary,
  buildCustomerTotals,
  getCustomerReportTitle,
} from "./reportHelpers";

const rpservice = ReportService();
const RangePicker = DatePicker.RangePicker;
const SCREEN_CUSTOMER_REPORT_GRID_TEMPLATE = "116px 2.8fr 160px 110px 170px";

const SalesByCustomerReport = () => {
  const [form] = Form.useForm();
  const [listDetail, setListDetail] = useState([]);
  const isFirstLoadRef = useRef(true);
  const dateRange = Form.useWatch("sodate", form);
  const viewMode = Form.useWatch("viewMode", form) || CUSTOMER_REPORT_MODE.NORMAL;

  const getIgnoreLoading = useCallback(() => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  }, []);

  const getData = useCallback((data) => {
    rpservice
      .getSalesByCustomer(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;

        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานยอดขายตามลูกค้าได้");
      });
  }, [getIgnoreLoading]);

  const savePageState = useCallback((searchValues) => {
    saveMyAccessSearchCookie(
      PAGE_COOKIE_KEY,
      {
        searchValues,
      },
      7
    );
  }, []);

  const handleSearch = useCallback(
    (forcedValues = null) => {
      const values = forcedValues ?? form.getFieldsValue(true);
      savePageState(values);
      const payload = buildSearchPayload(values);

      getData(payload);
    },
    [form, getData, savePageState]
  );

  const handleClear = useCallback(() => {
    clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
    form.resetFields();
    handleSearch({});
  }, [form, handleSearch]);

  const init = useCallback(async () => {
    const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY);

    if (restored?.searchValues) {
      form.setFieldsValue(restored.searchValues);
      return restored.searchValues;
    }

    return {};
  }, [form]);

  useEffect(() => {
    (async () => {
      const restoredSearchValues = await init();
      handleSearch(restoredSearchValues);
    })();

    return async () => {
      //console.clear();
    };
  }, [handleSearch, init]);

  const reportTitle = useMemo(() => getCustomerReportTitle(viewMode), [viewMode]);
  const customerRows = useMemo(
    () => buildCustomerSummary(listDetail, { mode: viewMode }),
    [listDetail, viewMode]
  );
  const reportTotals = useMemo(() => buildCustomerTotals(customerRows), [customerRows]);

  const totalSoCount = useMemo(
    () => new Set(listDetail.map((item) => item?.socode).filter(Boolean)).size,
    [listDetail]
  );

  const selectedDateLabel = useMemo(() => {
    if (!Array.isArray(dateRange) || dateRange.length !== 2) {
      return "ทั้งหมด";
    }

    return `${formatThaiDate(dateRange[0])} - ${formatThaiDate(dateRange[1])}`;
  }, [dateRange]);

  const printReport = useCallback(() => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `${window.location.origin}/sales-by-customer-print`;
  }, []);

  return (
    <div
      className="sales-by-customer-screen"
      style={{
        minHeight: "100vh",
        width: "100%",
        padding: "12px 16px 24px",
        boxSizing: "border-box",
        background: "#f5f7fb",
      }}
    >
      <style>
        {`
          .sales-by-customer-paper-content {
            width: 100%;
            min-width: 820px;
          }

          .sales-by-customer-mode-toggle {
            padding: 4px;
            border: 1px solid #d7deea;
            border-radius: 999px;
            background: linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .sales-by-customer-mode-toggle .ant-radio-button-wrapper {
            height: 34px;
            padding: 0 16px;
            border: none !important;
            border-radius: 999px !important;
            background: transparent;
            color: #475569;
            font-weight: 600;
            line-height: 34px;
            box-shadow: none !important;
            transition: all 0.2s ease;
          }

          .sales-by-customer-mode-toggle .ant-radio-button-wrapper::before {
            display: none !important;
          }

          .sales-by-customer-mode-toggle .ant-radio-button-wrapper:hover {
            color: #0f172a;
            background: rgba(148, 163, 184, 0.12);
          }

          .sales-by-customer-mode-toggle .ant-radio-button-wrapper-checked {
            background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%) !important;
            color: #ffffff !important;
            box-shadow: 0 8px 18px rgba(37, 99, 235, 0.28) !important;
          }
        `}
      </style>
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", width: "100%" }}
      >
        <Card
          style={{
            width: "100%",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div className="sales-by-customer-toolbar" style={{ padding: 18, borderBottom: "1px solid #edf0f4" }}>
            <Flex
              justify="space-between"
              align="flex-start"
              gap={16}
              wrap="wrap"
              style={{ width: "100%" }}
            >
              <div>
                <Typography.Title className="m-0 !text-zinc-800" level={3}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <TeamOutlined style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
                    <span>{reportTitle}</span>
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary">
                  สรุปยอดขายจากใบขายสินค้าแยกตามลูกค้า พร้อมจำนวนบิล ปริมาณขาย และยอดสุทธิ
                </Typography.Text>
              </div>
              <Form
                form={form}
                layout="inline"
                autoComplete="off"
                onValuesChange={(changedValues) => {
                  if (
                    Object.prototype.hasOwnProperty.call(changedValues, "sodate") ||
                    Object.prototype.hasOwnProperty.call(changedValues, "viewMode")
                  ) {
                    handleSearch();
                  }
                }}
              >
                <Form.Item name="sodate" className="!mb-2">
                  <RangePicker
                    placeholder={["From Date", "To Date"]}
                    style={{ minWidth: 260, height: 38 }}
                  />
                </Form.Item>
                <Form.Item name="viewMode" initialValue={CUSTOMER_REPORT_MODE.NORMAL} className="!mb-2">
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    className="sales-by-customer-mode-toggle"
                  >
                    <Radio.Button value={CUSTOMER_REPORT_MODE.NORMAL}>ปกติ</Radio.Button>
                    <Radio.Button value={CUSTOMER_REPORT_MODE.RANKING}>จัดอันดับ</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item className="!mb-2">
                  <Flex gap={8} wrap="wrap">
                    <Button
                      type="primary"
                      className="bn-action"
                      icon={<SearchOutlined />}
                      onClick={() => handleSearch()}
                    >
                      ค้นหา
                    </Button>
                    <Button
                      danger
                      className="bn-action"
                      icon={<ClearOutlined />}
                      onClick={() => handleClear()}
                    >
                      ล้าง
                    </Button>
                    {/* <Button
                      className="bn-action"
                      icon={<ReloadOutlined style={{ fontSize: ".9rem" }} />}
                      onClick={() => handleSearch()}
                    >
                      Refresh
                    </Button> */}
                    <Button
                      className="bn-action"
                      icon={<PrinterOutlined />}
                      onClick={printReport}
                    >
                      Print
                    </Button>
                  </Flex>
                </Form.Item>
              </Form>
            </Flex>
          </div>

          <div style={{ padding: 16, background: "#f3f5f9" }}>
            <div
              className="sales-by-customer-paper"
              style={{
                background: "#ffffff",
                border: "1px solid #d9dee7",
                borderRadius: 12,
                minHeight: "calc(100vh - 230px)",
                overflow: "auto",
              }}
            >
              <div
                className="sales-by-customer-paper-content"
                style={{
                  padding: 24,
                  color: "#111827",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <Flex justify="space-between" align="flex-start" gap={16}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{reportTitle}</div>
                    <div>ช่วงวันที่: {selectedDateLabel}</div>
                    <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>หน้า : 1</div>
                    <div>จำนวนลูกค้า : {customerRows.length}</div>
                    <div>จำนวนใบขายสินค้า : {totalSoCount}</div>
                  </div>
                </Flex>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 10,
                    borderTop: "1px solid #111827",
                    borderBottom: "1px solid #111827",
                    display: "grid",
                    gridTemplateColumns: SCREEN_CUSTOMER_REPORT_GRID_TEMPLATE,
                    gap: 10,
                    fontWeight: 700,
                  }}
                >
                  <div>รหัสลูกค้า</div>
                  <div>ชื่อลูกค้า</div>
                  {/* <div style={{ textAlign: "right" }}>จำนวนบิล</div> */}
                  {/* <div style={{ textAlign: "right" }}>จำนวนรวม</div> */}
                  <div style={{ textAlign: "right" }}>ยอดก่อน VAT</div>
                  <div style={{ textAlign: "right" }}>VAT</div>
                  <div style={{ textAlign: "right" }}>ยอดรวมสุทธิ</div>
                  {/* <div >ขายล่าสุด</div> */}
                </div>

                {customerRows.length < 1 ? (
                  <div style={{ padding: "56px 0" }}>
                    <Empty description="ไม่มีข้อมูลรายงาน" />
                  </div>
                ) : (
                  customerRows.map((row, index) => (
                    <div
                      key={row.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: SCREEN_CUSTOMER_REPORT_GRID_TEMPLATE,
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: index === customerRows.length - 1 ? "none" : "1px dotted #d1d5db",
                      }}
                    >
                      <div>{row.cuscode || "-"}</div>
                      <div>{row.cusname || "-"}</div>
                      {/* <div style={{ textAlign: "right" }}>
                        {formatMoney(row.invoiceCount, 0, 0)}
                      </div> */}
                      {/* <div
                        style={{
                          textAlign: "right",
                          color: "#1d4ed8",
                        }}
                      >
                        {formatMoney(row.totalQty, 2, 2)}
                      </div> */}
                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        {formatMoney(row.totalSubtotal, 2, 2)}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {formatMoney(row.totalVatAmount, 2, 2)}
                      </div>
                      <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                        {formatMoney(row.totalNet, 2, 2)}
                      </div>
                      {/* <div>{formatThaiDate(row.lastSaleDate)}</div> */}
                    </div>
                  ))
                )}

                {customerRows.length > 0 && (
                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 10,
                      borderTop: "2px solid #111827",
                      display: "grid",
                      gridTemplateColumns: SCREEN_CUSTOMER_REPORT_GRID_TEMPLATE,
                      gap: 10,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <div style={{ gridColumn: "1 / 3" }}>รวมทั้งหมด</div>
                    {/* <div style={{ textAlign: "right" }}>
                      {formatMoney(reportTotals.invoiceCount, 0, 0)}
                    </div>
                    <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                      {formatMoney(reportTotals.totalQty, 2, 2)}
                    </div> */}
                    <div style={{ textAlign: "right" }}>
                      {formatMoney(reportTotals.totalSubtotal, 2, 2)}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {formatMoney(reportTotals.totalVatAmount, 2, 2)}
                    </div>
                    <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                      {formatMoney(reportTotals.totalNet, 2, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default SalesByCustomerReport;