import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button, Empty, Flex, Spin, Typography, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { PiPrinterFill } from "react-icons/pi";
import "../delivery/delivery.css";
import "../dry-report/DryReportPrintPreview.css";
import "./MyPrint.css";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";
import {
  PAGE_COOKIE_KEY,
  CUSTOMER_REPORT_MODE,
  formatThaiDate,
  buildSearchPayload,
  buildCustomerSummary,
  buildCustomerTotals,
  buildCustomerReportPages,
  getCustomerReportTitle,
} from "./model";

const rpservice = ReportService();

function SalesByCustomerPrintPreview() {
  const componentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);
  const [searchValues, setSearchValues] = useState({});
  const viewMode = searchValues?.viewMode || CUSTOMER_REPORT_MODE.NORMAL;
  const modeLabel = viewMode === CUSTOMER_REPORT_MODE.RANKING ? "จัดอันดับ" : "ปกติ";

  const handlePrint = useReactToPrint({
    documentTitle: "Sales By Customer Report",
    onBeforePrint: () => {},
    onAfterPrint: () => {},
    removeAfterPrint: true,
  });

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

  const ContentHead = ({ pageNumber }) => (
    <div className="dry-report-page-header sales-by-customer-page-header">
      <div className="dry-report-page-header-top">
        <div className="dry-report-brand-block">
          <div className="dry-report-brand-badge">Sales By Customer Report</div>
          <Flex className="mb-1.5" vertical>
            <Typography.Text className="dry-report-company" strong>
              บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
            </Typography.Text>
            <Typography.Text className="dry-report-company-meta">
              60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
            </Typography.Text>
            <Typography.Text className="dry-report-company-meta">
              TEL: 076 641 117, 098 192 9391
            </Typography.Text>
            <Typography.Text className="dry-report-company-meta">
              เลขประจำตัวผู้เสียภาษี 083556101164 สำนักงานใหญ่
            </Typography.Text>
          </Flex>
        </div>
        <div className="dry-report-title-block">
          <Typography.Text className="dry-report-title" strong>
            {reportTitle}
          </Typography.Text>
          <Typography.Text className="dry-report-title-subtitle">
            สรุปยอดขายแยกตามลูกค้าจากใบขายสินค้า | โหมด{modeLabel} | ช่วงวันที่ {selectedDateLabel}
          </Typography.Text>
          <Typography.Text className="dry-report-page-counter">
            หน้า {pageNumber} / {reportPages.length}
          </Typography.Text>
        </div>
      </div>
    </div>
  );

  const ColumnHeader = () => (
    <div className="sales-by-customer-grid sales-by-customer-column-header">
      <div>รหัสลูกค้า</div>
      <div>ชื่อลูกค้า</div>
      <div className="sales-text-right">ยอดก่อน VAT</div>
      <div className="sales-text-right">VAT</div>
      <div className="sales-text-right">ยอดสุทธิ</div>
    </div>
  );

  const GrandTotal = () => (
    <div className="sales-by-customer-grid sales-by-customer-grand-total">
      <div className="sales-by-customer-total-label">รวมทั้งหมด</div>
      <div className="sales-by-customer-total-subtotal sales-text-right">
        {formatMoney(reportTotals.totalSubtotal, 2, 2)}
      </div>
      <div className="sales-by-customer-total-vat sales-text-right">
        {formatMoney(reportTotals.totalVatAmount, 2, 2)}
      </div>
      <div className="sales-by-customer-total-net sales-text-right sales-text-accent">
        {formatMoney(reportTotals.totalNet, 2, 2)}
      </div>
    </div>
  );

  const PrintablePages = () => {
    if (!loading && customerRows.length < 1) {
      return (
        <div ref={componentRef}>
          <div className="dry-report-paper">
            <div className="dry-report-paper-content sales-by-customer-print-page">
              <ContentHead pageNumber={1} />
              <div className="sales-by-customer-empty-state">
                <Typography.Title level={4} className="sales-by-customer-empty-title">
                  {reportTitle}
                </Typography.Title>
                <Typography.Text type="secondary">โหมด: {modeLabel}</Typography.Text>
                <Typography.Text type="secondary">
                  ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Sales By Customer Report
                </Typography.Text>
                <div className="sales-by-customer-empty-content">
                  <Empty description="ไม่มีข้อมูลรายงาน" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={componentRef}>
        {reportPages.map((page, pageIndex) => (
          <Fragment key={`page-${pageIndex}`}>
            <div className="dry-report-paper">
              <div className="dry-report-paper-content sales-by-customer-print-page">
                <ContentHead pageNumber={pageIndex + 1} />
                <div className="dry-report-table-wrap sales-by-customer-table-wrap">
                  <ColumnHeader />
                  <div className="sales-by-customer-page-sections">
                    {page.rows.map((row, index) => (
                      <div
                        key={row.key}
                        className={`sales-by-customer-grid sales-by-customer-row${
                          index === page.rows.length - 1 ? " sales-by-customer-row-last" : ""
                        }`}
                      >
                        <div>{row.cuscode || "-"}</div>
                        <div>{row.cusname || "-"}</div>
                        <div className="sales-text-right">{formatMoney(row.totalSubtotal, 2, 2)}</div>
                        <div className="sales-text-right">{formatMoney(row.totalVatAmount, 2, 2)}</div>
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(row.totalNet, 2, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {page.includeGrandTotal && <GrandTotal />}
                </div>
              </div>
            </div>
            {pageIndex < reportPages.length - 1 && (
              <div className="dry-report-page-break" aria-hidden="true" />
            )}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="dry-report-print-screen sales-by-customer-print-screen" id="dnpv">
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="dry-report-toolbar">
        <div className="dry-report-toolbar-copy">
          <span className="dry-report-toolbar-kicker">Preview</span>
          <h1 className="dry-report-toolbar-title">Sales By Customer Print Preview</h1>
        </div>
        <Button
          type="primary"
          className="dry-report-print-button"
          onClick={() => {
            handlePrint(null, () => componentRef.current);
          }}
          icon={<PiPrinterFill className="dry-report-print-button-icon" />}
        >
          พิมพ์รายงาน
        </Button>
      </div>

      <div className="dry-report-preview-shell">
        <PrintablePages />
      </div>
    </div>
  );
}

export default SalesByCustomerPrintPreview;