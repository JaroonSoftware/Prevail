import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Flex, Spin, Typography, message } from "antd";
import { LoadingOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./MyPrint.css";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";

const rpservice = ReportService();
const PAGE_COOKIE_KEY = "sales-by-product-report";
const GRID_TEMPLATE = "110px 120px 120px 1.6fr 90px 70px 110px 70px 120px 130px";
const PAGE_HEIGHT_ESTIMATE = 742;
const PAGE_HEADER_ESTIMATE = 82;
const PAGE_COLUMN_HEADER_ESTIMATE = 36;
const PAGE_TOTAL_ESTIMATE = 44;
const GROUP_MARGIN_ESTIMATE = 14;
const GROUP_TITLE_ESTIMATE = 20;
const GROUP_SUMMARY_ESTIMATE = 32;
const ROW_BASE_HEIGHT_ESTIMATE = 20;
const ROW_EXTRA_LINE_HEIGHT_ESTIMATE = 10;
const CUSTOMER_NAME_WRAP_LENGTH = 30;
const CODE_WRAP_LENGTH = 14;
const GROUP_TITLE_WRAP_LENGTH = 38;

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

const buildSearchPayload = (values = {}) => {
  const data = { ...values };

  if (Array.isArray(data?.sodate) && data.sodate.length === 2) {
    const [sodate_form, sodate_to] = data.sodate.map((value) =>
      dayjs(value).format("YYYY-MM-DD")
    );
    Object.assign(data, { sodate_form, sodate_to });
  }

  delete data.sodate;
  return data;
};

const estimateWrappedLines = (text, wrapLength) => {
  if (!text) {
    return 1;
  }

  const normalizedText = String(text).trim();
  if (!normalizedText) {
    return 1;
  }

  return Math.max(1, Math.ceil(normalizedText.length / wrapLength));
};

const estimateRowHeight = (item) => {
  const customerLines = estimateWrappedLines(item?.cusname, CUSTOMER_NAME_WRAP_LENGTH);
  const customerCodeLines = estimateWrappedLines(item?.cuscode, CODE_WRAP_LENGTH);
  const soCodeLines = estimateWrappedLines(item?.socode, CODE_WRAP_LENGTH);
  const textLines = Math.max(customerLines, customerCodeLines, soCodeLines);

  return ROW_BASE_HEIGHT_ESTIMATE + (textLines - 1) * ROW_EXTRA_LINE_HEIGHT_ESTIMATE;
};

const estimateGroupTitleHeight = (group) => {
  const groupTitleLines = estimateWrappedLines(
    `${group?.stname || ""} ${group?.stcode || ""}`,
    GROUP_TITLE_WRAP_LENGTH
  );

  return GROUP_TITLE_ESTIMATE + (groupTitleLines - 1) * ROW_EXTRA_LINE_HEIGHT_ESTIMATE;
};

function SalesByProductPrintPreview() {
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
        message.error("ไม่สามารถดึงข้อมูลรายงานขายแยกตามสินค้าได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedReport = useMemo(() => {
    const sortedDetails = [...listDetail].sort((left, right) => {
      const leftProductKey = `${left?.stcode || ""} ${left?.stname || ""}`.trim();
      const rightProductKey = `${right?.stcode || ""} ${right?.stname || ""}`.trim();

      if (leftProductKey !== rightProductKey) {
        return leftProductKey.localeCompare(rightProductKey, "th");
      }

      const leftDate = dayjs(left?.sodate).valueOf() || 0;
      const rightDate = dayjs(right?.sodate).valueOf() || 0;
      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      const leftSoCode = String(left?.socode || "");
      const rightSoCode = String(right?.socode || "");
      if (leftSoCode !== rightSoCode) {
        return leftSoCode.localeCompare(rightSoCode, "th");
      }

      return String(left?.cuscode || "").localeCompare(String(right?.cuscode || ""), "th");
    });

    const grouped = sortedDetails.reduce((accumulator, item) => {
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

    return Object.values(grouped).sort((left, right) => {
      const leftKey = `${left?.stcode || ""} ${left?.stname || ""}`.trim();
      const rightKey = `${right?.stcode || ""} ${right?.stname || ""}`.trim();
      return leftKey.localeCompare(rightKey, "th");
    });
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
    if (!Array.isArray(searchValues?.sodate) || searchValues.sodate.length !== 2) {
      return "ทั้งหมด";
    }

    return `${formatThaiDate(searchValues.sodate[0])} - ${formatThaiDate(searchValues.sodate[1])}`;
  }, [searchValues]);

  const reportPages = useMemo(() => {
    if (groupedReport.length < 1) {
      return [{ sections: [], includeGrandTotal: false }];
    }

    const pages = [];
    let currentSections = [];
    let currentHeight = PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE;

    const pushCurrentPage = () => {
      if (currentSections.length > 0) {
        pages.push({ sections: currentSections, includeGrandTotal: false });
      }

      currentSections = [];
      currentHeight = PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE;
    };

    groupedReport.forEach((group) => {
      const titleHeight = estimateGroupTitleHeight(group);
      let section = null;

      const startSection = (continuedFromPrevious) => {
        const minimumGroupHeight = GROUP_MARGIN_ESTIMATE + titleHeight + ROW_BASE_HEIGHT_ESTIMATE;

        if (
          currentSections.length > 0 &&
          currentHeight + minimumGroupHeight > PAGE_HEIGHT_ESTIMATE
        ) {
          pushCurrentPage();
        }

        section = {
          key: `${group.key}-${currentSections.length}`,
          stcode: group.stcode,
          stname: group.stname,
          unit: group.unit,
          items: [],
          totalQty: group.totalQty,
          totalSubtotal: group.totalSubtotal,
          totalNet: group.totalNet,
          showSummary: false,
          continuedFromPrevious,
          continuesToNext: false,
        };

        currentSections.push(section);
        currentHeight += GROUP_MARGIN_ESTIMATE + titleHeight;
      };

      group.items.forEach((item, index) => {
        const rowHeight = estimateRowHeight(item);
        const isLastRow = index === group.items.length - 1;
        const requiredHeight = rowHeight + (isLastRow ? GROUP_SUMMARY_ESTIMATE : 0);

        if (!section) {
          startSection(false);
        }

        if (
          section.items.length > 0 &&
          currentHeight + requiredHeight > PAGE_HEIGHT_ESTIMATE
        ) {
          section.continuesToNext = true;
          pushCurrentPage();
          startSection(true);
        }

        section.items.push(item);
        currentHeight += rowHeight;

        if (isLastRow) {
          section.showSummary = true;
          currentHeight += GROUP_SUMMARY_ESTIMATE;
        }
      });
    });

    if (currentSections.length > 0) {
      pages.push({ sections: currentSections, includeGrandTotal: false });
    }

    const lastPage = pages[pages.length - 1];
    const lastPageContentHeight = lastPage.sections.reduce((sum, section) => {
      const sectionRowsHeight = section.items.reduce(
        (rowSum, item) => rowSum + estimateRowHeight(item),
        0
      );

      return (
        sum +
        GROUP_MARGIN_ESTIMATE +
        estimateGroupTitleHeight(section) +
        sectionRowsHeight +
        (section.showSummary ? GROUP_SUMMARY_ESTIMATE : 0)
      );
    }, PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE);

    if (lastPageContentHeight + PAGE_TOTAL_ESTIMATE > PAGE_HEIGHT_ESTIMATE) {
      pages.push({ sections: [], includeGrandTotal: true });
    } else {
      lastPage.includeGrandTotal = true;
    }

    return pages;
  }, [groupedReport]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return (
    <div
      className="sales-by-product-print-screen"
      style={{ "--sales-grid-template": GRID_TEMPLATE }}
    >
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="sales-by-product-print-toolbar">
        <Flex gap={8} wrap="wrap">
          {/* <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            โหลดข้อมูลล่าสุด
          </Button> */}
          <Button type="primary" icon={<PrinterOutlined />} onClick={printReport}>
            Print
          </Button>
        </Flex>
      </div>

      <div className="sales-by-product-print-wrapper">
        {groupedReport.length < 1 && !loading ? (
          <div className="sales-by-product-print-paper sales-by-product-print-paper-single">
            <div className="sales-by-product-print-paper-content">
              <div className="sales-by-product-empty-state">
                <Typography.Title level={4} className="sales-by-product-empty-title">
                  รายงานขายแยกตามสินค้า
                </Typography.Title>
                <Typography.Text type="secondary">
                  ไม่พบข้อมูลจากเงื่อนไขล่าสุดของหน้า Sales By Product Report
                </Typography.Text>
                <div className="sales-by-product-empty-content">
                  <Empty description="ไม่มีข้อมูลรายงาน" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          reportPages.map((page, pageIndex) => (
            <Fragment key={`page-${pageIndex}`}>
              <div className="sales-by-product-print-paper sales-by-product-print-sheet">
                <div className="sales-by-product-print-paper-content sales-by-product-print-page">
                <Flex className="sales-by-product-page-header" justify="space-between" align="flex-start" gap={15}>
                  <div>
                    <div className="sales-by-product-title">รายงานขายแยกตามสินค้า (ใบขายสินค้า)</div>
                    <div>ช่วงวันที่: {selectedDateLabel}</div>
                    <div>พิมพ์เมื่อ: {formatThaiDate(new Date())}</div>
                  </div>
                  <div className="sales-by-product-header-right">
                    <div>หน้า : {pageIndex + 1} / {reportPages.length}</div>
                    <div>จำนวนสินค้า : {groupedReport.length}</div>
                    <div>จำนวนใบขายสินค้า : {totalSoCount}</div>
                  </div>
                </Flex>

                <div className="sales-by-product-grid sales-by-product-column-header">
                  <div>วันที่</div>
                  <div>เลขที่ใบขายสินค้า</div>
                  <div>รหัสลูกค้า</div>
                  {/* <div>ชื่อลูกค้า</div> */}
                  <div className="sales-text-right">จำนวน</div>
                  <div>หน่วย</div>
                  <div className="sales-text-right">ราคาต่อหน่วย</div>
                  <div className="sales-text-right">VAT</div>
                  <div className="sales-text-right">รวมก่อน VAT</div>
                  <div className="sales-text-right">ยอดรวมสุทธิ</div>
                </div>

                {page.sections.map((group) => (
                  <div className="sales-by-product-group" key={`${pageIndex}-${group.key}`}>
                    <div className="sales-by-product-group-title">
                      {group.stname} / {group.stcode}
                      {group.continuedFromPrevious ? " (ต่อ)" : ""}
                    </div>

                    {group.items.map((item, index) => (
                      <div
                        key={`${group.key}-${item.socode}-${index}`}
                        className={`sales-by-product-grid sales-by-product-row${
                          index === group.items.length - 1 ? " sales-by-product-row-last" : ""
                        }`}
                      >
                        <div>{formatThaiDate(item.sodate)}</div>
                        <div>{item.socode || "-"}</div>
                        <div>{item.cuscode || "-"}</div>
                        {/* <div>{item.cusname || "-"}</div> */}
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(item.qty, 2, 2)}
                        </div>
                        <div>{item.unit || "-"}</div>
                        <div className="sales-text-right">{formatMoney(item.price, 2, 2)}</div>
                        <div className="sales-text-right">{formatMoney(item.vat, 0, 0)}</div>
                        <div className="sales-text-right">{formatMoney(item.lineSubtotal, 2, 2)}</div>
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(item.lineNetTotal, 2, 2)}
                        </div>
                      </div>
                    ))}

                    {group.showSummary && (
                      <div className="sales-by-product-grid sales-by-product-group-summary">
                        <div className="sales-by-product-summary-label">รวม {group.stcode}</div>
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(group.totalQty, 2, 2)}
                        </div>
                        <div>{group.unit}</div>
                        <div />
                        <div />
                        <div className="sales-text-right">{formatMoney(group.totalSubtotal, 2, 2)}</div>
                        <div className="sales-text-right sales-text-accent">
                          {formatMoney(group.totalNet, 2, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {page.includeGrandTotal && (
                  <div className="sales-by-product-grid sales-by-product-grand-total">
                    <div className="sales-by-product-total-label">รวมทั้งหมด</div>
                    <div className="sales-text-right sales-text-accent">
                      {formatMoney(reportTotals.totalQty, 2, 2)}
                    </div>
                    <div />
                    <div />
                    <div />
                    <div className="sales-text-right">{formatMoney(reportTotals.totalSubtotal, 2, 2)}</div>
                    <div className="sales-text-right sales-text-accent">
                      {formatMoney(reportTotals.totalNet, 2, 2)}
                    </div>
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

export default SalesByProductPrintPreview;
