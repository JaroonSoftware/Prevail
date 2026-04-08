import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button, Empty, Flex, Spin, Typography, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { PiPrinterFill } from "react-icons/pi";
import dayjs from "dayjs";
import "../delivery/delivery.css";
import "../dry-report/DryReportPrintPreview.css";
import "./MyPrint.css";

import ReportService from "../../../service/Report.service";
import { formatMoney } from "../../../utils/util";
import { loadMyAccessSearchCookie } from "../../../utils/myaccessSearchCookie";

const rpservice = ReportService();
const PAGE_COOKIE_KEY = "sales-by-product-report";
const PAGE_HEIGHT_ESTIMATE = 530;
const PAGE_HEADER_ESTIMATE = 75;
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
  const componentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [listDetail, setListDetail] = useState([]);

  const handlePrint = useReactToPrint({
    documentTitle: "Sales By Product Report",
    onBeforePrint: () => {},
    onAfterPrint: () => {},
    removeAfterPrint: true,
  });

  const fetchData = useCallback((forcedSearchValues = null) => {
    const restored = forcedSearchValues ?? loadMyAccessSearchCookie(PAGE_COOKIE_KEY)?.searchValues ?? {};
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

  const ContentHead = ({ pageNumber }) => (
    <>
      <div className="dry-report-page-header sales-by-product-page-header">
        <div className="dry-report-page-header-top">
          <div className="dry-report-brand-block">
            <div className="dry-report-brand-badge">Sales By Product Report</div>
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
              รายงานขายแยกตามสินค้า
            </Typography.Text>
            <Typography.Text className="dry-report-title-subtitle">
              เอกสารสรุปยอดขายแยกตามสินค้าแบบจัดกลุ่มตามรายการสินค้า
            </Typography.Text>
            <Typography.Text className="dry-report-page-counter">
              หน้า {pageNumber} / {reportPages.length}
            </Typography.Text>
          </div>
        </div>
      </div>
    </>
  );

  const ColumnHeader = () => (
    <div className="sales-by-product-grid sales-by-product-column-header">
      <div>วันที่</div>
      <div>เลขที่ใบขายสินค้า</div>
      <div>รหัสลูกค้า</div>
      <div className="sales-text-right">จำนวน</div>
      <div>หน่วย</div>
      <div className="sales-text-right">ราคาต่อหน่วย</div>
      <div className="sales-text-right">VAT</div>
      <div className="sales-text-right">รวมก่อน VAT</div>
      <div className="sales-text-right">ยอดรวมสุทธิ</div>
    </div>
  );

  const GroupSection = ({ group, pageIndex }) => (
    <div className="sales-by-product-group" key={`${pageIndex}-${group.key}`}>
      <div className="sales-by-product-group-title-row">
        <div>
          <Typography.Text className="sales-by-product-group-code" strong>
            {group.stcode}
          </Typography.Text>
          <Typography.Text className="sales-by-product-group-name" strong>
            {group.stname}
          </Typography.Text>
          {group.continuedFromPrevious ? (
            <Typography.Text className="sales-by-product-group-continued">
              ต่อจากหน้าก่อน
            </Typography.Text>
          ) : null}
        </div>
        <Typography.Text className="sales-by-product-group-unit">
          หน่วย: {group.unit}
        </Typography.Text>
      </div>

      <div className="sales-by-product-group-body">
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
            <div className="sales-by-product-summary-qty sales-text-right sales-text-accent">
              {formatMoney(group.totalQty, 2, 2)}
            </div>
            <div className="sales-by-product-summary-unit">{group.unit}</div>
            <div className="sales-by-product-summary-subtotal sales-text-right">
              {formatMoney(group.totalSubtotal, 2, 2)}
            </div>
            <div className="sales-by-product-summary-net sales-text-right sales-text-accent">
              {formatMoney(group.totalNet, 2, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const GrandTotal = () => (
    <div className="sales-by-product-grid sales-by-product-grand-total">
      <div className="sales-by-product-total-label">รวมทั้งหมด</div>
      <div className="sales-by-product-summary-qty sales-text-right sales-text-accent">
        {formatMoney(reportTotals.totalQty, 2, 2)}
      </div>
      <div className="sales-by-product-summary-subtotal sales-text-right">
        {formatMoney(reportTotals.totalSubtotal, 2, 2)}
      </div>
      <div className="sales-by-product-summary-net sales-text-right sales-text-accent">
        {formatMoney(reportTotals.totalNet, 2, 2)}
      </div>
    </div>
  );

  const PrintablePages = () => {
    if (!loading && groupedReport.length < 1) {
      return (
        <div ref={componentRef}>
          <div className="dry-report-paper">
            <div className="dry-report-paper-content sales-by-product-print-page">
              <ContentHead pageNumber={1} />
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
        </div>
      );
    }

    return (
      <div ref={componentRef}>
        {reportPages.map((page, pageIndex) => (
          <Fragment key={`page-${pageIndex}`}>
            <div className="dry-report-paper">
              <div className="dry-report-paper-content sales-by-product-print-page">
                <ContentHead pageNumber={pageIndex + 1} />
                <div className="dry-report-table-wrap sales-by-product-table-wrap">
                  <ColumnHeader />
                  <div className="sales-by-product-page-sections">
                    {page.sections.map((group) => (
                      <GroupSection group={group} pageIndex={pageIndex} key={`${pageIndex}-${group.key}`} />
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
    <div
      className="dry-report-print-screen sales-by-product-print-screen"
      id="dnpv"
    >
      {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}

      <div className="dry-report-toolbar">
        <div className="dry-report-toolbar-copy">
          <span className="dry-report-toolbar-kicker">Preview</span>
          <h1 className="dry-report-toolbar-title">Sales By Product Print Preview</h1>
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

export default SalesByProductPrintPreview;
