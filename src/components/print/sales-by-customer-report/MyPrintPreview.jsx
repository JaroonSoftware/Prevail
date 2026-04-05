import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Flex, Spin, Typography, message } from "antd";
import { LoadingOutlined, PrinterOutlined } from "@ant-design/icons";
import "./MyPrint.css";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";
import {
  PAGE_COOKIE_KEY,
  CUSTOMER_REPORT_MODE,
  CUSTOMER_REPORT_GRID_TEMPLATE,
  formatThaiDate,
  buildSearchPayload,
  buildCustomerSummary,
  buildCustomerTotals,
  buildCustomerReportPages,
  getCustomerReportTitle,
} from "../../../pages/reports/sales-by-customer-report/reportHelpers";

const rpservice = ReportService();

function SalesByCustomerPrintPreview() {
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);
  const [searchValues, setSearchValues] = useState({});
  const viewMode = searchValues?.viewMode || CUSTOMER_REPORT_MODE.NORMAL;
  const modeLabel = viewMode === CUSTOMER_REPORT_MODE.RANKING ? "จัดอันดับ" : "ปกติ";

  const fetchData = useCallback((forcedSearchValues = null) => {
    const restored = forcedSearchValues ?? loadMyAccessSearchCookie(PAGE_COOKIE_KEY)?.searchValues ?? {};
    setSearchValues(restored);
    setLoading(true);

    rpservice
      .getSalesByCustomer(buildSearchPayload(restored), { ignoreLoading: true })
      .then((res) => {
        const { data } = res.data;
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานยอดขายตามลูกค้าได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reportTitle = useMemo(() => getCustomerReportTitle(viewMode), [viewMode]);
  const customerRows = useMemo(
    () => buildCustomerSummary(listDetail, { mode: viewMode }),
    [listDetail, viewMode]
  );
  const reportTotals = useMemo(() => buildCustomerTotals(customerRows), [customerRows]);
  const reportPages = useMemo(() => buildCustomerReportPages(customerRows), [customerRows]);

  const selectedDateLabel = useMemo(() => {
    if (!Array.isArray(searchValues?.sodate) || searchValues.sodate.length !== 2) {
      return "ทั้งหมด";
    }

    return `${formatThaiDate(searchValues.sodate[0])} - ${formatThaiDate(searchValues.sodate[1])}`;
  }, [searchValues]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return (
    <div
      className="sales-by-customer-print-screen"
      style={{ "--sales-grid-template": CUSTOMER_REPORT_GRID_TEMPLATE }}
    >
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="sales-by-customer-print-toolbar">
        <Flex gap={8} wrap="wrap">
          <Button type="primary" icon={<PrinterOutlined />} onClick={printReport}>
            Print
          </Button>
        </Flex>
      </div>

      <div className="sales-by-customer-print-wrapper">
        {customerRows.length < 1 && !loading ? (
          <div className="sales-by-customer-print-paper sales-by-customer-print-paper-single">
            <div className="sales-by-customer-print-paper-content">
              <div className="sales-by-customer-empty-state">
                <Typography.Title level={4} className="sales-by-customer-empty-title">
                  {reportTitle}
                </Typography.Title>
                <Typography.Text type="secondary">โหมด: {modeLabel}</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Sales By Customer Report
                </Typography.Text>
                <div className="sales-by-customer-empty-content">
                  <Empty description="ไม่มีข้อมูลรายงาน" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          reportPages.map((page, pageIndex) => (
            <Fragment key={`page-${pageIndex}`}>
              <div className="sales-by-customer-print-paper sales-by-customer-print-sheet">
                <div className="sales-by-customer-print-paper-content sales-by-customer-print-page">
                  <Flex className="sales-by-customer-page-header" justify="space-between" align="flex-start" gap={15}>
                    <div>
                      <div className="sales-by-customer-title">{reportTitle}</div>
                      {/* <div>โหมด: {modeLabel}</div> */}
                      <div>ช่วงวันที่: {selectedDateLabel}</div>
                      <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                    </div>
                    <div className="sales-by-customer-header-right">
                      <div>หน้า : {pageIndex + 1} / {reportPages.length}</div>
                      <div>จำนวนลูกค้า : {customerRows.length}</div>
                      <div>จำนวนใบขายสินค้า : {reportTotals.invoiceCount}</div>
                    </div>
                  </Flex>

                  <div className="sales-by-customer-grid sales-by-customer-column-header">
                    <div>รหัสลูกค้า</div>
                    <div>ชื่อลูกค้า</div>
                        {/* <div className="sales-text-right">จำนวนบิล</div>
                        <div className="sales-text-right">จำนวนรวม</div> */}
                    <div className="sales-text-right">ยอดก่อน VAT</div>
                    <div className="sales-text-right">VAT</div>
                    <div className="sales-text-right">ยอดสุทธิ</div>
                    {/* <div>ขายล่าสุด</div> */}
                  </div>

                  {page.rows.map((row, index) => (
                    <div
                      key={row.key}
                      className={`sales-by-customer-grid sales-by-customer-row${
                        index === page.rows.length - 1 ? " sales-by-customer-row-last" : ""
                      }`}
                    >
                      <div>{row.cuscode || "-"}</div>
                      <div>{row.cusname || "-"}</div>
                      {/* <div className="sales-text-right">{formatMoney(row.invoiceCount, 0, 0)}</div>
                      <div className="sales-text-right sales-text-accent">{formatMoney(row.totalQty, 2, 2)}</div> */}
                      <div className="sales-text-right">{formatMoney(row.totalSubtotal, 2, 2)}</div>
                      <div className="sales-text-right">{formatMoney(row.totalVatAmount, 2, 2)}</div>
                      <div className="sales-text-right sales-text-accent">{formatMoney(row.totalNet, 2, 2)}</div>
                      {/* <div>{formatThaiDate(row.lastSaleDate)}</div> */}
                    </div>
                  ))}

                  {page.includeGrandTotal && (
                    <div className="sales-by-customer-grid sales-by-customer-grand-total">
                      <div className="sales-by-customer-total-label">รวมทั้งหมด</div>
                      {/* <div className="sales-text-right">{formatMoney(reportTotals.invoiceCount, 0, 0)}</div>
                      <div className="sales-text-right sales-text-accent">{formatMoney(reportTotals.totalQty, 2, 2)}</div> */}
                      <div className="sales-text-right">{formatMoney(reportTotals.totalSubtotal, 2, 2)}</div>
                      <div className="sales-text-right">{formatMoney(reportTotals.totalVatAmount, 2, 2)}</div>
                      <div className="sales-text-right sales-text-accent">{formatMoney(reportTotals.totalNet, 2, 2)}</div>
                    </div>
                  )}
                </div>
              </div>
              {pageIndex < reportPages.length - 1 && <div className="sales-page-break" />}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}

export default SalesByCustomerPrintPreview;