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
  Tag,
  Modal,
  Table,
} from "antd";
import {
  WalletOutlined,
  SearchOutlined,
  ClearOutlined,
  PrinterOutlined,
  UnorderedListOutlined,
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
  OUTSTANDING_REPORT_TITLE,
  OUTSTANDING_REPORT_GRID_TEMPLATE,
  formatThaiDate,
  buildSearchPayload,
  buildCustomerSummary,
  buildCustomerTotals,
} from "./reportHelpers";

const rpservice = ReportService();
const MonthPicker = DatePicker;

const OutstandingByCustomerReport = () => {
  const [form] = Form.useForm();
  const [listDetail, setListDetail] = useState([]);
  const [billListRow, setBillListRow] = useState(null);
  const isFirstLoadRef = useRef(true);
  const monthValue = Form.useWatch("month", form);

  const getIgnoreLoading = useCallback(() => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  }, []);

  const getData = useCallback((data) => {
    rpservice
      .getOutstandingByCustomer(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;

        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานค้างจ่ายตามลูกค้าได้");
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

  const customerRows = useMemo(() => buildCustomerSummary(listDetail), [listDetail]);
  const reportTotals = useMemo(() => buildCustomerTotals(customerRows), [customerRows]);

  const selectedMonthLabel = useMemo(() => {
    if (!monthValue) {
      return "ทั้งหมด";
    }

    return formatThaiDate(monthValue);
  }, [monthValue]);

  const printReport = useCallback(() => {
    const url = `${window.location.origin}/outstanding-by-customer-print`;
    const newWindow = window.open('', url, url);
    newWindow.location.href = url;
  }, []);

  return (
    <div
      className="outstanding-by-customer-screen"
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
          .outstanding-by-customer-paper-content {
            width: 100%;
            min-width: 820px;
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
          <div className="outstanding-by-customer-toolbar" style={{ padding: 18, borderBottom: "1px solid #edf0f4" }}>
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
                    <WalletOutlined style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
                    <span>{OUTSTANDING_REPORT_TITLE}</span>
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary">
                  สรุปยอดใบวางบิลที่ยังไม่ออกใบเสร็จรับเงิน (ค้างจ่าย) แยกตามลูกค้า
                </Typography.Text>
              </div>
              <Form
                form={form}
                layout="inline"
                autoComplete="off"
                onValuesChange={(changedValues) => {
                  if (Object.prototype.hasOwnProperty.call(changedValues, "month")) {
                    handleSearch();
                  }
                }}
              >
                <Form.Item name="month" className="!mb-2">
                  <MonthPicker
                    picker="month"
                    placeholder="เลือกเดือน"
                    style={{ minWidth: 180, height: 38 }}
                    format="MM/YYYY"
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
              className="outstanding-by-customer-paper"
              style={{
                background: "#ffffff",
                border: "1px solid #d9dee7",
                borderRadius: 12,
                minHeight: "calc(100vh - 230px)",
                overflow: "auto",
              }}
            >
              <div
                className="outstanding-by-customer-paper-content"
                style={{
                  padding: 24,
                  color: "#111827",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <Flex justify="space-between" align="flex-start" gap={16}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{OUTSTANDING_REPORT_TITLE}</div>
                    <div>เดือน: {selectedMonthLabel}</div>
                    <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>หน้า : 1</div>
                    <div>จำนวนลูกค้า : {customerRows.length}</div>
                    <div>จำนวนใบวางบิลค้างจ่าย : {reportTotals.billCount}</div>
                  </div>
                </Flex>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 10,
                    borderTop: "1px solid #111827",
                    borderBottom: "1px solid #111827",
                    display: "grid",
                    gridTemplateColumns: OUTSTANDING_REPORT_GRID_TEMPLATE,
                    gap: 10,
                    fontWeight: 700,
                  }}
                >
                  <div>รหัสลูกค้า</div>
                  <div>ชื่อลูกค้า</div>
                  <div style={{ textAlign: "right" }}>จำนวนใบวางบิล</div>
                  <div style={{ textAlign: "right" }}>ยอดค้างจ่าย</div>
                  <div>ครบกำหนดใกล้สุด</div>
                </div>

                {customerRows.length < 1 ? (
                  <div style={{ padding: "56px 0" }}>
                    <Empty description="ไม่มีรายการค้างจ่าย" />
                  </div>
                ) : (
                  customerRows.map((row, index) => (
                    <div
                      key={row.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: OUTSTANDING_REPORT_GRID_TEMPLATE,
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: index === customerRows.length - 1 ? "none" : "1px dotted #d1d5db",
                      }}
                    >
                      <div>{row.cuscode || "-"}</div>
                      <div>{row.cusname || "-"}</div>
                      <div style={{ textAlign: "right" }}>
                        <Flex justify="flex-end" align="center" gap={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<UnorderedListOutlined />}
                            style={{ padding: 0, height: "auto" }}
                            onClick={() => setBillListRow(row)}
                            title="ดูรายการใบวางบิล"
                          />
                          <span>{formatMoney(row.billCount, 0)}</span>
                        </Flex>
                      </div>
                      <div style={{ textAlign: "right", color: "#dc2626", fontWeight: 600 }}>
                        {formatMoney(row.totalOutstanding, 2)}
                      </div>
                      <div>
                        {row.nearestDueDate ? (
                          <Tag color={row.isOverdue ? "red" : "default"}>
                            {formatThaiDate(row.nearestDueDate)}
                          </Tag>
                        ) : (
                          "-"
                        )}
                      </div>
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
                      gridTemplateColumns: OUTSTANDING_REPORT_GRID_TEMPLATE,
                      gap: 10,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <div style={{ gridColumn: "1 / 3" }}>รวมทั้งหมด</div>
                    <div style={{ textAlign: "right" }}>
                      {formatMoney(reportTotals.billCount, 0)}
                    </div>
                    <div style={{ textAlign: "right", color: "#dc2626" }}>
                      {formatMoney(reportTotals.totalOutstanding, 2)}
                    </div>
                    <div></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Space>

      <Modal
        open={!!billListRow}
        title={`รายการใบวางบิลค้างจ่าย${billListRow ? ` : ${billListRow.cuscode || "-"} ${billListRow.cusname || "-"}` : ""}`}
        onCancel={() => setBillListRow(null)}
        footer={null}
        destroyOnClose
      >
        <Table
          size="small"
          rowKey="key"
          dataSource={billListRow?.bills || []}
          pagination={false}
          columns={[
            { title: "เลขที่ใบวางบิล", dataIndex: "blcode" },
            {
              title: "วันที่บิล",
              dataIndex: "bldate",
              render: (value) => formatThaiDate(value),
            },
            {
              title: "ครบกำหนด",
              dataIndex: "duedate",
              render: (value) => formatThaiDate(value),
            },
            {
              title: "ยอดค้างจ่าย",
              dataIndex: "grandTotal",
              align: "right",
              render: (value) => formatMoney(value, 2),
            },
          ]}
          summary={(pageData) => {
            const sum = pageData.reduce((total, item) => total + Number(item.grandTotal || 0), 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} className="text-right">
                    <strong>ยอดรวม</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong style={{ color: "#dc2626" }}>{formatMoney(sum, 2)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Modal>
    </div>
  );
};

export default OutstandingByCustomerReport;
