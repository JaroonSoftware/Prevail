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
    <div className="best-selling-product-print-screen" id="best-selling-product-report">
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
                <div className="best-selling-product-print-header">
                  <Typography.Title level={4} className="best-selling-product-empty-title">
                    {BEST_SELLING_REPORT_TITLE}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Best Selling Product Report
                  </Typography.Text>
                </div>
                <div className="best-selling-product-empty-content">
                  <Empty description="ไม่มีข้อมูลรายงาน" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          reportPages.map((page, pageIndex) => (
            <Fragment key={`page-${pageIndex}`}>
              <div className="best-selling-product-print-paper best-selling-product-print-sheet">
                <div className="best-selling-product-print-paper-content best-selling-product-print-page">
                  <div className="best-selling-product-print-header">
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
                  </div>

                  <table className="best-selling-product-table">
                    <thead>
                      <tr>
                        <th className="col-rank text-right">อันดับ</th>
                        <th className="col-code">รหัสสินค้า</th>
                        <th className="col-name">ชื่อสินค้า</th>
                        <th className="col-unit">หน่วยนับ</th>
                        <th className="col-qty text-right">ปริมาณขายสุทธิ</th>
                        <th className="col-total text-right">มูลค่าขายสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.rows.map((row) => (
                        <tr key={row.key}>
                          <td className="text-right text-accent">{formatMoney(row.rank, 0, 0)}</td>
                          <td>{row.stcode || "-"}</td>
                          <td>{row.stname || "-"}</td>
                          <td>{row.unit || "-"}</td>
                          <td className="text-right">{formatMoney(row.totalQty, 2, 2)}</td>
                          <td className="text-right text-accent">{formatMoney(row.totalSubtotal, 2, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {page.includeGrandTotal && (
                      <tfoot>
                        <tr>
                          <td colSpan="4" className="total-label-cell">รวมทั้งหมด</td>
                          <td className="text-right">{formatMoney(reportTotals.totalQty, 2, 2)}</td>
                          <td className="text-right text-accent">{formatMoney(reportTotals.totalSubtotal, 2, 2)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
              {pageIndex < reportPages.length - 1 && <div className="best-selling-page-break" />}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}

export default BestSellingProductPrintPreview;