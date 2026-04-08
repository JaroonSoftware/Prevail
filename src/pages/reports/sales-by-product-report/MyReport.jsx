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
  BarChartOutlined,
  SearchOutlined,
  ClearOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import {
  saveMyAccessSearchCookie,
  loadMyAccessSearchCookie,
  clearMyAccessSearchCookie,
} from "../../../utils/myaccessSearchCookie";

const rpservice = ReportService();
const RangePicker = DatePicker.RangePicker;
const REPORT_GRID_TEMPLATE =
  "minmax(88px, 1fr) minmax(100px, 1.05fr) minmax(100px, 1.05fr) minmax(72px, 0.8fr) minmax(64px, 0.7fr) minmax(96px, 1fr) minmax(60px, 0.65fr) minmax(108px, 1.15fr) minmax(118px, 1.2fr)";

const formatThaiDate = (value) => {
  if (!value) {
    return "-";
  }

  const dateValue = dayjs(value);
  if (!dateValue.isValid()) {
    return "-";
  }

  return `${dateValue.format("DD/MM/")}${dateValue.year() + 543}`;
};

const SalesByProductReport = () => {
  const PAGE_COOKIE_KEY = "sales-by-product-report";
  const [form] = Form.useForm();
  const [listDetail, setListDetail] = useState([]);
  const isFirstLoadRef = useRef(true);
  const dateRange = Form.useWatch("sodate", form);

  const getIgnoreLoading = useCallback(() => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  }, []);

  const getData = useCallback((data) => {
    rpservice
      .getSalesByProduct(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;

        setListDetail(data);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  }, [getIgnoreLoading]);

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

  const handleSearch = useCallback(
    (forcedValues = null) => {
      const values = forcedValues ?? form.getFieldsValue(true);
      savePageState(values);
      const payload = buildSearchPayload(values);

      getData(payload);
    },
    [buildSearchPayload, form, getData, savePageState]
  );

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

  const groupedReport = useMemo(() => {
    const grouped = listDetail.reduce((accumulator, item) => {
      const groupKey = [item?.stcode || "", item?.stname || "", item?.unit || ""].join("__");

      if (!accumulator[groupKey]) {
        accumulator[groupKey] = {
          key: groupKey,
          stcode: item?.stcode || "-",
          stname: item?.stname || "-",
          unit: item?.unit || "-",
          items: [],
          totalQty: 0,
          totalSubtotal: 0,
          totalNet: 0,
        };
      }

      const qty = Number(item?.qty || 0);
      const price = Number(item?.price || 0);
      const vat = Number(item?.vat || 0);
      const lineSubtotal = Number(item?.line_subtotal ?? qty * price);
      const lineNetTotal = Number(item?.line_net_total ?? lineSubtotal * (1 + vat / 100));

      accumulator[groupKey].items.push({
        ...item,
        qty,
        price,
        vat,
        lineSubtotal,
        lineNetTotal,
      });
      accumulator[groupKey].totalQty += qty;
      accumulator[groupKey].totalSubtotal += lineSubtotal;
      accumulator[groupKey].totalNet += lineNetTotal;

      return accumulator;
    }, {});

    return Object.values(grouped);
  }, [listDetail]);

  const reportTotals = useMemo(
    () =>
      groupedReport.reduce(
        (accumulator, group) => ({
          totalQty: accumulator.totalQty + Number(group.totalQty || 0),
          totalSubtotal: accumulator.totalSubtotal + Number(group.totalSubtotal || 0),
          totalNet: accumulator.totalNet + Number(group.totalNet || 0),
        }),
        { totalQty: 0, totalSubtotal: 0, totalNet: 0 }
      ),
    [groupedReport]
  );

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
    // window.open(previewUrl, "_blank", "noopener,noreferrer");
    const url = `${window.location.origin}/sales-by-product-print`;
    const newWindow = window.open('', url, url);
    newWindow.location.href = url;

  }, []);

  return (
    <div
      className="sales-by-product-screen"
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
          .sales-by-product-paper-content {
            width: 100%;
            min-width: 100%;
          }

          .sales-by-product-grid-cell {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          @media print {
            html,
            body {
              width: 297mm;
              height: 210mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: hidden !important;
            }

            body * {
              visibility: hidden !important;
            }

            .sales-by-product-screen {
              min-height: auto !important;
              width: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #fff !important;
            }

            .sales-by-product-paper,
            .sales-by-product-paper * {
              visibility: visible !important;
            }

            .sales-by-product-paper {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: calc(297mm - 20mm) !important;
              min-height: calc(210mm - 20mm) !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              overflow: visible !important;
              background: #fff !important;
              box-shadow: none !important;
            }

            .sales-by-product-paper-content {
              min-width: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
            }

            .sales-by-product-paper-content > div,
            .sales-by-product-paper-content .ant-flex {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .sales-by-product-screen .ant-card,
            .sales-by-product-screen .ant-card-body,
            .sales-by-product-screen .ant-space,
            .sales-by-product-screen .ant-space-item {
              visibility: visible !important;
              background: transparent !important;
              box-shadow: none !important;
            }

            .sales-by-product-toolbar,
            .sales-by-product-screen .ant-card-head,
            .sales-by-product-screen button {
              display: none !important;
            }
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
          <div className="sales-by-product-toolbar" style={{ padding: 18, borderBottom: "1px solid #edf0f4" }}>
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
                    <BarChartOutlined style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
                    <span>รายงานขายแยกตามสินค้า</span>
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary">
                  แสดงรายงานจากข้อมูลใบขายสินค้า แยกตามสินค้า พร้อมผลรวมรายสินค้าและยอดรวมสุทธิ
                </Typography.Text>
              </div>
              <Form
                form={form}
                layout="inline"
                autoComplete="off"
                onValuesChange={(changedValues) => {
                  if (Object.prototype.hasOwnProperty.call(changedValues, "sodate")) {
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
              className="sales-by-product-paper"
              style={{
                background: "#ffffff",
                border: "1px solid #d9dee7",
                borderRadius: 12,
                minHeight: "calc(100vh - 230px)",
                overflow: "auto",
              }}
            >
              <div
                className="sales-by-product-paper-content"
                style={{
                  padding: 24,
                  color: "#111827",
                  // fontFamily: '"Courier New", monospace',
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <Flex justify="space-between" align="flex-start" gap={16}>
                  <div>
                    <div style={{ fontWeight: 700 }}>รายงานขายแยกตามสินค้า (ใบขายสินค้า)</div>
                    <div>ช่วงวันที่: {selectedDateLabel}</div>
                    <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>หน้า : 1</div>
                    <div>จำนวนสินค้า : {groupedReport.length}</div>
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
                    gridTemplateColumns: REPORT_GRID_TEMPLATE,
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  <div className="sales-by-product-grid-cell">วันที่</div>
                  <div className="sales-by-product-grid-cell">เลขที่ใบขายสินค้า</div>
                  <div className="sales-by-product-grid-cell">รหัสลูกค้า</div>
                  {/* <div>ชื่อลูกค้า</div> */}
                  <div style={{ textAlign: "right" }}>จำนวน</div>
                  <div className="sales-by-product-grid-cell">หน่วย</div>
                  <div style={{ textAlign: "right" }}>ราคาต่อหน่วย</div>
                  <div style={{ textAlign: "right" }}>VAT</div>
                  <div style={{ textAlign: "right" }}>รวมก่อน VAT</div>
                  <div style={{ textAlign: "right" }}>ยอดรวมสุทธิ</div>
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

                      {group.items.map((item, index) => (
                        <div
                          key={`${group.key}-${item.socode}-${index}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: REPORT_GRID_TEMPLATE,
                            gap: 8,
                            padding: "3px 0",
                            borderBottom: index === group.items.length - 1 ? "none" : "1px dotted #d1d5db",
                          }}
                        >
                          <div className="sales-by-product-grid-cell">{formatThaiDate(item.sodate)}</div>
                          <div className="sales-by-product-grid-cell">{item.socode || "-"}</div>
                          <div className="sales-by-product-grid-cell">{item.cuscode || "-"}</div>
                          {/* <div>{item.cusname || "-"}</div> */}
                          <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                            {formatMoney(item.qty, 2, 2)}
                          </div>
                          <div className="sales-by-product-grid-cell">{item.unit || "-"}</div>
                          <div style={{ textAlign: "right" }}>
                            {formatMoney(item.price, 2, 2)}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {formatMoney(item.vat, 0, 0)}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {formatMoney(item.lineSubtotal, 2, 2)}
                          </div>
                          <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                            {formatMoney(item.lineNetTotal, 2, 2)}
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop: "1px dashed #111827",
                          display: "grid",
                          gridTemplateColumns: REPORT_GRID_TEMPLATE,
                          gap: 8,
                          fontWeight: 700,
                        }}
                      >
                        <div style={{ gridColumn: "1 / 4", color: "#111827" }}>
                          รวม {group.stcode}
                        </div>
                        <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                          {formatMoney(group.totalQty, 2, 2)}
                        </div>
                        <div>{group.unit}</div>
                        <div />
                        <div />
                        <div style={{ textAlign: "right" }}>
                          {formatMoney(group.totalSubtotal, 2, 2)}
                        </div>
                        <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                          {formatMoney(group.totalNet, 2, 2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {groupedReport.length > 0 && (
                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 10,
                      borderTop: "2px solid #111827",
                      display: "grid",
                      gridTemplateColumns: REPORT_GRID_TEMPLATE,
                      gap: 8,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <div style={{ gridColumn: "1 / 4" }}>รวมทั้งหมด</div>
                    <div style={{ textAlign: "right", color: "#1d4ed8" }}>
                      {formatMoney(reportTotals.totalQty, 2, 2)}
                    </div>
                    <div />
                    <div />
                    <div />
                    <div style={{ textAlign: "right" }}>
                      {formatMoney(reportTotals.totalSubtotal, 2, 2)}
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

export default SalesByProductReport;