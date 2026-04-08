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
  Empty,
} from "antd";
import {
  FundProjectionScreenOutlined,
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
  REPORT_GRID_TEMPLATE,
  formatThaiDate,
  buildSearchPayload,
  buildProductCustomerSummary,
  buildReportTotals,
} from "./reportHelpers";

const rpservice = ReportService();
const RangePicker = DatePicker.RangePicker;

const ProfitByProductCustomerReport = () => {
  const [form] = Form.useForm();
  const [listDetail, setListDetail] = useState([]);
  const isFirstLoadRef = useRef(true);
  const dateRange = Form.useWatch("dndate", form);

  const getIgnoreLoading = useCallback(() => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  }, []);

  const getData = useCallback((data) => {
    rpservice
      .getProfitByProductCustomer(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานกำไรรายสินค้าแยกลูกค้าได้");
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

    return async () => {};
  }, [handleSearch, init]);

  const groupedReport = useMemo(() => buildProductCustomerSummary(listDetail), [listDetail]);
  const reportTotals = useMemo(() => buildReportTotals(groupedReport), [groupedReport]);

  const totalSoCount = useMemo(
    () => new Set(listDetail.map((item) => item?.socode).filter(Boolean)).size,
    [listDetail]
  );

  const totalCustomerCount = useMemo(
    () => new Set(listDetail.map((item) => item?.cuscode).filter(Boolean)).size,
    [listDetail]
  );

  const selectedDateLabel = useMemo(() => {
    if (!Array.isArray(dateRange) || dateRange.length !== 2) {
      return "ทั้งหมด";
    }

    return `${formatThaiDate(dateRange[0])} - ${formatThaiDate(dateRange[1])}`;
  }, [dateRange]);

  const printReport = useCallback(() => {
    const url = `${window.location.origin}/profit-by-product-customer-print`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  }, []);

  return (
    <div
      className="profit-by-product-customer-screen"
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
          .profit-by-product-customer-paper-content {
            width: 100%;
            min-width: 100%;
          }

          .profit-by-product-customer-table-wrap {
            overflow-x: auto;
          }

          .profit-by-product-customer-grid {
            display: grid;
            grid-template-columns: ${REPORT_GRID_TEMPLATE};
            gap: 6px;
            align-items: start;
          }

          .profit-by-product-customer-grid-cell {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
        `}
      </style>
      <Space direction="vertical" size="middle" style={{ display: "flex", width: "100%" }}>
        <Card
          style={{
            width: "100%",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: 18, borderBottom: "1px solid #edf0f4" }}>
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap" style={{ width: "100%" }}>
              <div>
                <Typography.Title className="m-0 !text-zinc-800" level={3}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <FundProjectionScreenOutlined style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
                    <span>รายงานกำไรรายสินค้า แบ่งลูกค้า</span>
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary">
                  สรุปยอดขายสุทธิ ต้นทุน และกำไร แยกตามสินค้า แล้วแตกตามลูกค้าในแต่ละสินค้า
                </Typography.Text>
              </div>
              <Form
                form={form}
                layout="inline"
                autoComplete="off"
                onValuesChange={(changedValues) => {
                  if (Object.prototype.hasOwnProperty.call(changedValues, "dndate")) {
                    handleSearch();
                  }
                }}
              >
                <Form.Item name="dndate" className="!mb-2">
                  <RangePicker placeholder={["From Date", "To Date"]} style={{ minWidth: 260, height: 38 }} />
                </Form.Item>
                <Form.Item className="!mb-2">
                  <Flex gap={8} wrap="wrap">
                    <Button type="primary" className="bn-action" icon={<SearchOutlined />} onClick={() => handleSearch()}>
                      ค้นหา
                    </Button>
                    <Button danger className="bn-action" icon={<ClearOutlined />} onClick={() => handleClear()}>
                      ล้าง
                    </Button>
                    <Button className="bn-action" icon={<PrinterOutlined />} onClick={printReport}>
                      Print
                    </Button>
                  </Flex>
                </Form.Item>
              </Form>
            </Flex>
          </div>

          <div style={{ padding: 16, background: "#f3f5f9" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #d9dee7",
                borderRadius: 12,
                minHeight: "calc(100vh - 230px)",
                overflow: "auto",
              }}
            >
              <div
                className="profit-by-product-customer-paper-content"
                style={{
                  padding: 24,
                  color: "#111827",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <Flex justify="space-between" align="flex-start" gap={16}>
                  <div>
                    <div style={{ fontWeight: 700 }}>รายงานกำไรรายสินค้า แบ่งลูกค้า</div>
                    <div>ช่วงวันที่: {selectedDateLabel}</div>
                    <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>จำนวนสินค้า : {groupedReport.length}</div>
                    <div>จำนวนลูกค้า : {totalCustomerCount}</div>
                    <div>จำนวนใบขายสินค้า : {totalSoCount}</div>
                  </div>
                </Flex>

                <div className="profit-by-product-customer-table-wrap">
                  <div
                    className="profit-by-product-customer-grid"
                    style={{
                      marginTop: 16,
                      paddingTop: 10,
                      borderTop: "1px solid #111827",
                      borderBottom: "1px solid #111827",
                      fontWeight: 700,
                    }}
                  >
                    <div className="profit-by-product-customer-grid-cell">รหัสลูกค้า</div>
                    <div className="profit-by-product-customer-grid-cell">ชื่อลูกค้า</div>
                    <div style={{ textAlign: "right" }}>จำนวนบิล</div>
                    <div style={{ textAlign: "right" }}>จำนวน</div>
                    <div style={{ textAlign: "right" }}>ยอดขายสุทธิ</div>
                    <div style={{ textAlign: "right" }}>ต้นทุน</div>
                    <div style={{ textAlign: "right" }}>กำไร</div>
                  </div>

                  {groupedReport.length < 1 ? (
                    <div style={{ padding: "56px 0" }}>
                      <Empty description="ไม่มีข้อมูลรายงาน" />
                    </div>
                  ) : (
                    groupedReport.map((group) => (
                      <div key={group.key} style={{ marginTop: 18 }}>
                        <div
                          style={{
                            color: "#1d4ed8",
                            fontWeight: 700,
                            marginBottom: 6,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {group.stname} / {group.stcode}
                        </div>

                        {group.customers.map((customer, index) => (
                          <div
                            key={customer.key}
                            className="profit-by-product-customer-grid"
                            style={{
                              padding: "4px 0",
                              borderBottom:
                                index === group.customers.length - 1 ? "none" : "1px dotted #d1d5db",
                            }}
                          >
                            <div className="profit-by-product-customer-grid-cell">{customer.cuscode || "-"}</div>
                            <div className="profit-by-product-customer-grid-cell">{customer.cusname || "-"}</div>
                            <div style={{ textAlign: "right" }}>{formatMoney(customer.invoiceCount, 0, 0)}</div>
                            <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                              {formatMoney(customer.totalQty, 2, 2)}
                            </div>
                            <div style={{ textAlign: "right" }}>{formatMoney(customer.totalSales, 2, 2)}</div>
                            <div style={{ textAlign: "right" }}>{formatMoney(customer.totalCost, 2, 2)}</div>
                            <div style={{ textAlign: "right", color: customer.totalProfit < 0 ? "#dc2626" : "#15803d" }}>
                              {formatMoney(customer.totalProfit, 2, 2)}
                            </div>
                          </div>
                        ))}

                        <div
                          className="profit-by-product-customer-grid"
                          style={{
                            marginTop: 6,
                            paddingTop: 6,
                            borderTop: "1px dashed #111827",
                            fontWeight: 700,
                          }}
                        >
                          <div style={{ gridColumn: "1 / 3", color: "#111827" }}>รวม {group.stcode}</div>
                          <div />
                          <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                            {formatMoney(group.totalQty, 2, 2)}
                          </div>
                          <div style={{ textAlign: "right" }}>{formatMoney(group.totalSales, 2, 2)}</div>
                          <div style={{ textAlign: "right" }}>{formatMoney(group.totalCost, 2, 2)}</div>
                          <div style={{ textAlign: "right", color: group.totalProfit < 0 ? "#dc2626" : "#15803d" }}>
                            {formatMoney(group.totalProfit, 2, 2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {groupedReport.length > 0 && (
                    <div
                      className="profit-by-product-customer-grid"
                      style={{
                        marginTop: 20,
                        paddingTop: 10,
                        borderTop: "2px solid #111827",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      <div style={{ gridColumn: "1 / 4" }}>รวมทั้งหมด</div>
                      <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                        {formatMoney(reportTotals.totalQty, 2, 2)}
                      </div>
                      <div style={{ textAlign: "right" }}>{formatMoney(reportTotals.totalSales, 2, 2)}</div>
                      <div style={{ textAlign: "right" }}>{formatMoney(reportTotals.totalCost, 2, 2)}</div>
                      <div style={{ textAlign: "right", color: reportTotals.totalProfit < 0 ? "#dc2626" : "#15803d" }}>
                        {formatMoney(reportTotals.totalProfit, 2, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default ProfitByProductCustomerReport;