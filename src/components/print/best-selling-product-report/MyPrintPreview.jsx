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
  BEST_SELLING_REPORT_TITLE,
  formatThaiDate,
  buildSearchPayload,
  buildBestSellingProductSummary,
  buildBestSellingTotals,
  buildBestSellingPages,
} from "./model";

const rpservice = ReportService();

function BestSellingProductPrintPreview() {
  const componentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);
  const [searchValues, setSearchValues] = useState({});

  const handlePrint = useReactToPrint({
    documentTitle: "Best Selling Product Report",
    onBeforePrint: () => {},
    onAfterPrint: () => {},
    removeAfterPrint: true,
  });

  const fetchData = useCallback((forcedSearchValues = null) => {
    const restored = forcedSearchValues ?? loadMyAccessSearchCookie(PAGE_COOKIE_KEY)?.searchValues ?? {};
    setSearchValues(restored);
    setLoading(true);

    rpservice
      .getSalesByProduct(buildSearchPayload(restored), { ignoreLoading: true })
      .then((res) => {
        const { data } = res.data;
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานสินค้าขายดีได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const productRows = useMemo(() => buildBestSellingProductSummary(listDetail), [listDetail]);
  const reportTotals = useMemo(() => buildBestSellingTotals(productRows), [productRows]);
  const reportPages = useMemo(() => buildBestSellingPages(productRows), [productRows]);

  const selectedDateLabel = useMemo(() => {
    if (!Array.isArray(searchValues?.sodate) || searchValues.sodate.length !== 2) {
      return "ทั้งหมด";
    }

    return `${formatThaiDate(searchValues.sodate[0])} - ${formatThaiDate(searchValues.sodate[1])}`;
  }, [searchValues]);

  const ContentHead = ({ pageNumber }) => (
    <div className="dry-report-page-header best-selling-product-page-header">
      <div className="dry-report-page-header-top">
        <div className="dry-report-brand-block">
          <div className="dry-report-brand-badge">Best Selling Product Report</div>
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
            {BEST_SELLING_REPORT_TITLE}
          </Typography.Text>
          <Typography.Text className="dry-report-title-subtitle">
            สรุปยอดขายตามสินค้าแบบจัดอันดับจากยอดสุทธิสูงสุดลงมา | ช่วงวันที่ {selectedDateLabel}
          </Typography.Text>
          <Typography.Text className="dry-report-page-counter">
            หน้า {pageNumber} / {reportPages.length}
          </Typography.Text>
        </div>
      </div>
    </div>
  );

  const ColumnHeader = () => (
    <div className="best-selling-product-grid best-selling-product-column-header">
      <div>อันดับ</div>
      <div>รหัสสินค้า</div>
      <div>ชื่อสินค้า</div>
      <div>หน่วยนับ</div>
      <div className="sales-text-right">ปริมาณขายสุทธิ</div>
      <div className="sales-text-right">มูลค่าขายสุทธิ</div>
    </div>
  );

  const GrandTotal = () => (
    <div className="best-selling-product-grid best-selling-product-grand-total">
      <div className="best-selling-product-total-label">รวมทั้งหมด</div>
      <div className="best-selling-product-total-qty sales-text-right">
        {formatMoney(reportTotals.totalQty, 2, 2)}
      </div>
      <div className="best-selling-product-total-amount sales-text-right sales-text-accent">
        {formatMoney(reportTotals.totalSubtotal, 2, 2)}
      </div>
    </div>
  );

  const PrintablePages = () => {
    if (!loading && productRows.length < 1) {
      return (
        <div ref={componentRef}>
          <div className="dry-report-paper">
            <div className="dry-report-paper-content best-selling-product-print-page">
              <ContentHead pageNumber={1} />
              <div className="best-selling-product-empty-state">
                <Typography.Title level={4} className="best-selling-product-empty-title">
                  {BEST_SELLING_REPORT_TITLE}
                </Typography.Title>
                <Typography.Text type="secondary">
                  ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Best Selling Product Report
                </Typography.Text>
                <div className="best-selling-product-empty-content">
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
              <div className="dry-report-paper-content best-selling-product-print-page">
                <ContentHead pageNumber={pageIndex + 1} />
                <div className="dry-report-table-wrap best-selling-product-table-wrap">
                  <ColumnHeader />
                  <div className="best-selling-product-page-sections">
                    {page.rows.map((row, index) => (
                      <div
                        key={row.key}
                        className={`best-selling-product-grid best-selling-product-row${
                          index === page.rows.length - 1 ? " best-selling-product-row-last" : ""
                        }`}
                      >
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(row.rank, 0, 0)}
                        </div>
                        <div>{row.stcode || "-"}</div>
                        <div>{row.stname || "-"}</div>
                        <div>{row.unit || "-"}</div>
                        <div className="sales-text-right">{formatMoney(row.totalQty, 2, 2)}</div>
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(row.totalSubtotal, 2, 2)}
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
    <div className="dry-report-print-screen best-selling-product-print-screen" id="best-selling-product-report">
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="dry-report-toolbar">
        <div className="dry-report-toolbar-copy">
          <span className="dry-report-toolbar-kicker">Preview</span>
          <h1 className="dry-report-toolbar-title">Best Selling Product Print Preview</h1>
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

export default BestSellingProductPrintPreview;