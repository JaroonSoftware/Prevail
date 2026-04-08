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
  TrophyOutlined,
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
  BEST_SELLING_REPORT_TITLE,
  formatThaiDate,
  buildSearchPayload,
  buildBestSellingProductSummary,
  buildBestSellingTotals,
  BEST_SELLING_PRODUCT_GRID_TEMPLATE,
} from "./reportHelpers";

const rpservice = ReportService();
const RangePicker = DatePicker.RangePicker;

const BestSellingProductReport = () => {
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
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานสินค้าขายดีได้");
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
  }, [handleSearch, init]);

  const productRows = useMemo(() => buildBestSellingProductSummary(listDetail), [listDetail]);
  const reportTotals = useMemo(() => buildBestSellingTotals(productRows), [productRows]);

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
    const url = `${window.location.origin}/best-selling-product-print`;
    const newWindow = window.open('', url, url);
    newWindow.location.href = url;
  }, []);

  return (
    <div
      className="best-selling-product-screen"
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
          .best-selling-product-paper-content {
            width: 100%;
            min-width: 860px;
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
          <div className="best-selling-product-toolbar" style={{ padding: 18, borderBottom: "1px solid #edf0f4" }}>
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap" style={{ width: "100%" }}>
              <div>
                <Typography.Title className="m-0 !text-zinc-800" level={3}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <TrophyOutlined style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
                    <span>{BEST_SELLING_REPORT_TITLE}</span>
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary">
                  สรุปยอดขายตามสินค้าแบบจัดอันดับจากยอดสุทธิสูงสุดลงมา
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
              className="best-selling-product-paper"
              style={{
                background: "#ffffff",
                border: "1px solid #d9dee7",
                borderRadius: 12,
                minHeight: "calc(100vh - 230px)",
                overflow: "auto",
              }}
            >
              <div
                className="best-selling-product-paper-content"
                style={{
                  padding: 24,
                  color: "#111827",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <Flex justify="space-between" align="flex-start" gap={16}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{BEST_SELLING_REPORT_TITLE}</div>
                    <div>ช่วงวันที่: {selectedDateLabel}</div>
                    <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>หน้า : 1</div>
                    <div>จำนวนสินค้า : {productRows.length}</div>
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
                    gridTemplateColumns: BEST_SELLING_PRODUCT_GRID_TEMPLATE,
                    gap: 10,
                    fontWeight: 700,
                  }}
                >
                  <div style={{ textAlign: "right" }}>อันดับ</div>
                  <div>รหัสสินค้า</div>
                  <div>ชื่อสินค้า</div>
                  <div>หน่วยนับ</div>
                  <div style={{ textAlign: "right" }}>ปริมาณขายสุทธิ</div>
                  <div style={{ textAlign: "right" }}>มูลค่าขายสุทธิ</div>                  
                </div>

                {productRows.length < 1 ? (
                  <div style={{ padding: "56px 0" }}>
                    <Empty description="ไม่มีข้อมูลรายงาน" />
                  </div>
                ) : (
                  productRows.map((row, index) => (
                    <div
                      key={row.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: BEST_SELLING_PRODUCT_GRID_TEMPLATE,
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: index === productRows.length - 1 ? "none" : "1px dotted #d1d5db",
                      }}
                    >
                      <div style={{ textAlign: "right", color: "#1d4ed8", fontWeight: 700 }}>{formatMoney(row.rank, 0, 0)}</div>
                      <div>{row.stcode || "-"}</div>
                      <div>{row.stname || "-"}</div>
                      <div>{row.unit || "-"}</div>
                      <div style={{ textAlign: "right" }}>{formatMoney(row.totalQty, 2, 2)}</div>
                      <div style={{ textAlign: "right" }}>{formatMoney(row.totalSubtotal, 2, 2)}</div>
                    </div>
                  ))
                )}

                {productRows.length > 0 && (
                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 10,
                      borderTop: "2px solid #111827",
                      display: "grid",
                      gridTemplateColumns: BEST_SELLING_PRODUCT_GRID_TEMPLATE,
                      gap: 10,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <div style={{ gridColumn: "1 / 5" }}>รวมทั้งหมด</div>
                    <div style={{ textAlign: "right" }}>{formatMoney(reportTotals.totalQty, 2, 2)}</div>
                    <div style={{ textAlign: "right" }}>{formatMoney(reportTotals.totalSubtotal, 2, 2)}</div>
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

export default BestSellingProductReport;