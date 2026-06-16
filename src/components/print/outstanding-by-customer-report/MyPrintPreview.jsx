import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button, Empty, Flex, Spin, Tag, Typography, message } from "antd";
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
  OUTSTANDING_REPORT_TITLE,
  formatThaiDate,
  buildSearchPayload,
  buildCustomerSummary,
  buildCustomerTotals,
  buildCustomerReportPages,
} from "./model";

const rpservice = ReportService();

function OutstandingByCustomerPrintPreview() {
  const componentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);
  const [searchValues, setSearchValues] = useState({});

  const handlePrint = useReactToPrint({
    documentTitle: "Outstanding By Customer Report",
    onBeforePrint: () => {},
    onAfterPrint: () => {},
    removeAfterPrint: true,
  });

  const fetchData = useCallback((forcedSearchValues = null) => {
    const restored = forcedSearchValues ?? loadMyAccessSearchCookie(PAGE_COOKIE_KEY)?.searchValues ?? {};
    setSearchValues(restored);
    setLoading(true);

    rpservice
      .getOutstandingByCustomer(buildSearchPayload(restored), { ignoreLoading: true })
      .then((res) => {
        const { data } = res.data;
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานค้างจ่ายตามลูกค้าได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customerRows = useMemo(() => buildCustomerSummary(listDetail), [listDetail]);
  const reportTotals = useMemo(() => buildCustomerTotals(customerRows), [customerRows]);
  const reportPages = useMemo(() => buildCustomerReportPages(customerRows), [customerRows]);

  const selectedMonthLabel = useMemo(() => {
    if (!searchValues?.month) {
      return "ทั้งหมด";
    }

    return formatThaiDate(searchValues.month);
  }, [searchValues]);

  const ContentHead = ({ pageNumber }) => (
    <div className="dry-report-page-header outstanding-by-customer-page-header">
      <div className="dry-report-page-header-top">
        <div className="dry-report-brand-block">
          <div className="dry-report-brand-badge">Outstanding By Customer Report</div>
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
            {OUTSTANDING_REPORT_TITLE}
          </Typography.Text>
          <Typography.Text className="dry-report-title-subtitle">
            สรุปยอดใบวางบิลค้างจ่าย (ยังไม่ออกใบเสร็จรับเงิน) แยกตามลูกค้า | เดือน {selectedMonthLabel}
          </Typography.Text>
          <Typography.Text className="dry-report-page-counter">
            หน้า {pageNumber} / {reportPages.length}
          </Typography.Text>
        </div>
      </div>
    </div>
  );

  const ColumnHeader = () => (
    <div className="outstanding-by-customer-grid outstanding-by-customer-column-header">
      <div>รหัสลูกค้า</div>
      <div>ชื่อลูกค้า</div>
      <div className="outstanding-text-right">จำนวนใบวางบิล</div>
      <div className="outstanding-text-right">ยอดค้างจ่าย</div>
      <div>ครบกำหนดใกล้สุด</div>
    </div>
  );

  const GrandTotal = () => (
    <div className="outstanding-by-customer-grid outstanding-by-customer-grand-total">
      <div className="outstanding-by-customer-total-label">รวมทั้งหมด</div>
      <div className="outstanding-by-customer-total-count outstanding-text-right">
        {formatMoney(reportTotals.billCount, 0)}
      </div>
      <div className="outstanding-by-customer-total-amount outstanding-text-right outstanding-text-accent">
        {formatMoney(reportTotals.totalOutstanding, 2)}
      </div>
      <div></div>
    </div>
  );

  const PrintablePages = () => {
    if (!loading && customerRows.length < 1) {
      return (
        <div ref={componentRef}>
          <div className="dry-report-paper">
            <div className="dry-report-paper-content outstanding-by-customer-print-page">
              <ContentHead pageNumber={1} />
              <div className="outstanding-by-customer-empty-state">
                <Typography.Title level={4} className="outstanding-by-customer-empty-title">
                  {OUTSTANDING_REPORT_TITLE}
                </Typography.Title>
                <Typography.Text type="secondary">
                  ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Outstanding By Customer Report
                </Typography.Text>
                <div className="outstanding-by-customer-empty-content">
                  <Empty description="ไม่มีรายการค้างจ่าย" />
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
              <div className="dry-report-paper-content outstanding-by-customer-print-page">
                <ContentHead pageNumber={pageIndex + 1} />
                <div className="dry-report-table-wrap outstanding-by-customer-table-wrap">
                  <ColumnHeader />
                  <div className="outstanding-by-customer-page-sections">
                    {page.rows.map((row, index) => (
                      <div
                        key={row.key}
                        className={`outstanding-by-customer-grid outstanding-by-customer-row${
                          index === page.rows.length - 1 ? " outstanding-by-customer-row-last" : ""
                        }`}
                      >
                        <div>{row.cuscode || "-"}</div>
                        <div>{row.cusname || "-"}</div>
                        <div className="outstanding-text-right">{formatMoney(row.billCount, 0)}</div>
                        <div className="outstanding-text-right outstanding-text-accent">
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
    <div className="dry-report-print-screen outstanding-by-customer-print-screen" id="dnpv">
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="dry-report-toolbar">
        <div className="dry-report-toolbar-copy">
          <span className="dry-report-toolbar-kicker">Preview</span>
          <h1 className="dry-report-toolbar-title">Outstanding By Customer Print Preview</h1>
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

export default OutstandingByCustomerPrintPreview;
