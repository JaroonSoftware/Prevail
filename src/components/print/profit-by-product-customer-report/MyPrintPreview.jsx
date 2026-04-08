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
  buildProductCustomerSummary,
  buildProfitReportPages,
  buildReportTotals,
  buildSearchPayload,
} from "../../../pages/reports/profit-by-product-customer-report/reportHelpers";

const rpservice = ReportService();

function ProfitByProductCustomerPrintPreview() {
  const componentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);

  const handlePrint = useReactToPrint({
    documentTitle: "Profit By Product Customer Report",
    onBeforePrint: () => {},
    onAfterPrint: () => {},
    removeAfterPrint: true,
  });

  const fetchData = useCallback((forcedSearchValues = null) => {
    const restored = forcedSearchValues ?? loadMyAccessSearchCookie(PAGE_COOKIE_KEY)?.searchValues ?? {};
    setLoading(true);

    rpservice
      .getProfitByProductCustomer(buildSearchPayload(restored), { ignoreLoading: true })
      .then((res) => {
        const { data } = res.data;
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("ไม่สามารถดึงข้อมูลรายงานกำไรรายสินค้าแยกลูกค้าได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedReport = useMemo(() => buildProductCustomerSummary(listDetail), [listDetail]);
  const reportTotals = useMemo(() => buildReportTotals(groupedReport), [groupedReport]);
  const reportPages = useMemo(() => buildProfitReportPages(groupedReport), [groupedReport]);

  const totalSoCount = useMemo(
    () => new Set(listDetail.map((item) => item?.socode).filter(Boolean)).size,
    [listDetail]
  );

  const totalCustomerCount = useMemo(
    () => new Set(listDetail.map((item) => item?.cuscode).filter(Boolean)).size,
    [listDetail]
  );

  const ContentHead = ({ pageNumber }) => (
    <div className="dry-report-page-header">
      <div className="dry-report-page-header-top">
        <div className="dry-report-brand-block">
          <div className="dry-report-brand-badge">Profit By Product Report</div>
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
            รายงานกำไรรายสินค้า แบ่งลูกค้า
          </Typography.Text>
          <Typography.Text className="dry-report-title-subtitle">
            เอกสารสรุปยอดขายสุทธิ ต้นทุน และกำไร แยกตามสินค้าและลูกค้า
          </Typography.Text>
          <Typography.Text className="dry-report-page-counter">
            หน้า {pageNumber} / {reportPages.length}
          </Typography.Text>
          <Typography.Text className="dry-report-page-counter">
            จำนวนลูกค้า {totalCustomerCount} | จำนวนบิล {totalSoCount}
          </Typography.Text>
        </div>
      </div>
    </div>
  );

  const ColumnHeader = () => (
    <div className="profit-by-product-customer-grid profit-by-product-customer-column-header">
      <div>รหัสลูกค้า</div>
      <div>ชื่อลูกค้า</div>
      <div className="profit-text-right">จำนวนบิล</div>
      <div className="profit-text-right">จำนวน</div>
      <div className="profit-text-right">ยอดขายสุทธิ</div>
      <div className="profit-text-right">ต้นทุน</div>
      <div className="profit-text-right">กำไร</div>
    </div>
  );

  const GroupSection = ({ group, pageIndex }) => (
    <div className="profit-by-product-customer-group" key={`${pageIndex}-${group.key}`}>
      <div className="profit-by-product-customer-group-title-row">
        <div>
          <Typography.Text className="profit-by-product-customer-group-code" strong>
            {group.stcode}
          </Typography.Text>
          <Typography.Text className="profit-by-product-customer-group-name" strong>
            {group.stname}
          </Typography.Text>
          {group.continuedFromPrevious ? (
            <Typography.Text className="profit-by-product-customer-group-continued">
              ต่อจากหน้าก่อน
            </Typography.Text>
          ) : null}
        </div>
        {/* <Typography.Text className="profit-by-product-customer-group-unit">
          หน่วย: {group.unit}
        </Typography.Text> */}
      </div>

      <div className="profit-by-product-customer-group-body">
        {group.customers.map((row, index) => (
          <div
            key={row.key}
            className={`profit-by-product-customer-grid profit-by-product-customer-row${
              index === group.customers.length - 1 ? " profit-by-product-customer-row-last" : ""
            }`}
          >
            <div>{row.cuscode || "-"}</div>
            <div>{row.cusname || "-"}</div>
            <div className="profit-text-right">{formatMoney(row.invoiceCount, 0, 0)}</div>
            <div className="profit-text-right profit-text-accent">{formatMoney(row.totalQty, 2, 2)}</div>
            <div className="profit-text-right">{formatMoney(row.totalSales, 2, 2)}</div>
            <div className="profit-text-right">{formatMoney(row.totalCost, 2, 2)}</div>
            <div className={`profit-text-right ${row.totalProfit < 0 ? "profit-text-negative" : "profit-text-positive"}`}>
              {formatMoney(row.totalProfit, 2, 2)}
            </div>
          </div>
        ))}

        {group.showSummary && (
          <div className="profit-by-product-customer-grid profit-by-product-customer-group-summary">
            <div className="profit-summary-label">รวม {group.stcode}</div>
            <div className="profit-summary-qty profit-text-right profit-text-accent">
              {formatMoney(group.totalQty, 2, 2)}
            </div>
            <div className="profit-summary-sales profit-text-right">{formatMoney(group.totalSales, 2, 2)}</div>
            <div className="profit-summary-cost profit-text-right">{formatMoney(group.totalCost, 2, 2)}</div>
            <div className={`profit-summary-profit profit-text-right ${group.totalProfit < 0 ? "profit-text-negative" : "profit-text-positive"}`}>
              {formatMoney(group.totalProfit, 2, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const GrandTotal = () => (
    <div className="profit-by-product-customer-grid profit-by-product-customer-grand-total">
      <div className="profit-total-label">รวมทั้งหมด</div>
      <div className="profit-summary-qty profit-text-right profit-text-accent">
        {formatMoney(reportTotals.totalQty, 2, 2)}
      </div>
      <div className="profit-summary-sales profit-text-right">{formatMoney(reportTotals.totalSales, 2, 2)}</div>
      <div className="profit-summary-cost profit-text-right">{formatMoney(reportTotals.totalCost, 2, 2)}</div>
      <div className={`profit-summary-profit profit-text-right ${reportTotals.totalProfit < 0 ? "profit-text-negative" : "profit-text-positive"}`}>
        {formatMoney(reportTotals.totalProfit, 2, 2)}
      </div>
    </div>
  );

  const PrintablePages = () => {
    if (!loading && groupedReport.length < 1) {
      return (
        <div ref={componentRef}>
          <div className="dry-report-paper">
            <div className="dry-report-paper-content profit-by-product-customer-print-page">
              <ContentHead pageNumber={1} />
              <div className="profit-by-product-customer-empty-state">
                <Typography.Title level={4} className="profit-by-product-customer-empty-title">
                  รายงานกำไรรายสินค้า แบ่งลูกค้า
                </Typography.Title>
                <Typography.Text type="secondary">
                  ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Profit By Product Customer Report
                </Typography.Text>
                <div className="profit-by-product-customer-empty-content">
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
              <div className="dry-report-paper-content profit-by-product-customer-print-page">
                <ContentHead pageNumber={pageIndex + 1} />
                <div className="dry-report-table-wrap profit-by-product-customer-table-wrap">
                  <ColumnHeader />
                  <div className="profit-by-product-customer-page-sections">
                    {page.sections.map((group) => (
                      <GroupSection group={group} pageIndex={pageIndex} key={`${pageIndex}-${group.key}`} />
                    ))}
                  </div>
                  {page.includeGrandTotal && <GrandTotal />}
                </div>
              </div>
            </div>
            {pageIndex < reportPages.length - 1 && <div className="dry-report-page-break" aria-hidden="true" />}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="dry-report-print-screen profit-by-product-customer-print-screen" id="dnpv">
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="dry-report-toolbar">
        <div className="dry-report-toolbar-copy">
          <span className="dry-report-toolbar-kicker">Preview</span>
          <h1 className="dry-report-toolbar-title">Profit By Product Customer Print Preview</h1>
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

export default ProfitByProductCustomerPrintPreview;