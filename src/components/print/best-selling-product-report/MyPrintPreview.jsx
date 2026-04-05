import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Flex, Spin, Typography, message } from "antd";
import { LoadingOutlined, PrinterOutlined } from "@ant-design/icons";
import "./MyPrint.css";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";
import {
  PAGE_COOKIE_KEY,
  BEST_SELLING_REPORT_TITLE,
  BEST_SELLING_PRODUCT_GRID_TEMPLATE,
  formatThaiDate,
  buildSearchPayload,
  buildBestSellingProductSummary,
  buildBestSellingTotals,
  buildBestSellingPages,
} from "../../../pages/reports/best-selling-product-report/reportHelpers";

const rpservice = ReportService();

function BestSellingProductPrintPreview() {
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);
  const [searchValues, setSearchValues] = useState({});

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

  const totalSoCount = useMemo(
    () => new Set(listDetail.map((item) => item?.socode).filter(Boolean)).size,
    [listDetail]
  );

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
      className="best-selling-product-print-screen"
      style={{ "--sales-grid-template": BEST_SELLING_PRODUCT_GRID_TEMPLATE }}
    >
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="best-selling-product-print-toolbar">
        <Flex gap={8} wrap="wrap">
          <Button type="primary" icon={<PrinterOutlined />} onClick={printReport}>
            Print
          </Button>
        </Flex>
      </div>

      <div className="best-selling-product-print-wrapper">
        {productRows.length < 1 && !loading ? (
          <div className="best-selling-product-print-paper best-selling-product-print-paper-single">
            <div className="best-selling-product-print-paper-content">
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
        ) : (
          reportPages.map((page, pageIndex) => (
            <Fragment key={`page-${pageIndex}`}>
              <div className="best-selling-product-print-paper">
                <div className="best-selling-product-print-paper-content best-selling-product-print-page">
                  <Flex className="best-selling-product-page-header" justify="space-between" align="flex-start" gap={15}>
                    <div>
                      <div className="best-selling-product-title">{BEST_SELLING_REPORT_TITLE}</div>
                      <div>ช่วงวันที่: {selectedDateLabel}</div>
                      <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                    </div>
                    <div className="best-selling-product-header-right">
                      <div>หน้า : {pageIndex + 1} / {reportPages.length}</div>
                      <div>จำนวนสินค้า : {productRows.length}</div>
                      <div>จำนวนใบขายสินค้า : {totalSoCount}</div>
                    </div>
                  </Flex>

                  <div className="best-selling-product-grid best-selling-product-column-header">
                    <div className="sales-text-right">อันดับ</div>
                    <div>รหัสสินค้า</div>
                    <div>ชื่อสินค้า</div>
                    <div>หน่วย</div>
                    <div className="sales-text-right">จำนวนขายรวม</div>
                    <div className="sales-text-right">ยอดก่อน VAT</div>
                    <div className="sales-text-right">VAT</div>
                    <div className="sales-text-right">ยอดสุทธิ</div>
                  </div>

                  {page.rows.map((row, index) => (
                    <div
                      key={row.key}
                      className={`best-selling-product-grid best-selling-product-row${
                        index === page.rows.length - 1 ? " best-selling-product-row-last" : ""
                      }`}
                    >
                      <div className="sales-text-right sales-text-accent">{formatMoney(row.rank, 0, 0)}</div>
                      <div>{row.stcode || "-"}</div>
                      <div>{row.stname || "-"}</div>
                      <div>{row.unit || "-"}</div>
                      <div className="sales-text-right">{formatMoney(row.totalQty, 2, 2)}</div>
                      <div className="sales-text-right">{formatMoney(row.totalSubtotal, 2, 2)}</div>
                      <div className="sales-text-right">{formatMoney(row.totalVatAmount, 2, 2)}</div>
                      <div className="sales-text-right sales-text-accent">{formatMoney(row.totalNet, 2, 2)}</div>
                    </div>
                  ))}

                  {page.includeGrandTotal && (
                    <div className="best-selling-product-grid best-selling-product-grand-total">
                      <div className="best-selling-product-total-label">รวมทั้งหมด</div>
                      <div className="sales-text-right">{formatMoney(reportTotals.totalQty, 2, 2)}</div>
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

export default BestSellingProductPrintPreview;