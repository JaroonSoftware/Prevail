import dayjs from "dayjs";

export const PAGE_COOKIE_KEY = "outstanding-by-customer-report";
export const OUTSTANDING_REPORT_TITLE = "รายงานค้างจ่ายตามลูกค้า";
export const OUTSTANDING_REPORT_GRID_TEMPLATE = "110px 2.4fr 150px 170px 150px";

const PAGE_HEIGHT_ESTIMATE = 742;
const PAGE_HEADER_ESTIMATE = 82;
const PAGE_COLUMN_HEADER_ESTIMATE = 36;
const PAGE_TOTAL_ESTIMATE = 44;
const ROW_BASE_HEIGHT_ESTIMATE = 22;
const ROW_EXTRA_LINE_HEIGHT_ESTIMATE = 10;
const CUSTOMER_NAME_WRAP_LENGTH = 34;

export const formatThaiDate = (value) => {
  if (!value) {
    return "-";
  }

  const dateValue = dayjs(value);
  if (!dateValue.isValid()) {
    return "-";
  }

  return `${dateValue.format("DD/MM/")}${dateValue.year() + 543}`;
};

export const buildSearchPayload = (values = {}) => {
  const data = { ...values };

  if (data?.month) {
    const monthValue = dayjs(data.month);
    if (monthValue.isValid()) {
      Object.assign(data, {
        bldate_form: monthValue.startOf("month").format("YYYY-MM-DD"),
        bldate_to: monthValue.endOf("month").format("YYYY-MM-DD"),
      });
    }
  }

  delete data.month;
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

export const estimateOutstandingRowHeight = (row) => {
  const nameLines = estimateWrappedLines(row?.cusname, CUSTOMER_NAME_WRAP_LENGTH);
  return ROW_BASE_HEIGHT_ESTIMATE + (nameLines - 1) * ROW_EXTRA_LINE_HEIGHT_ESTIMATE;
};

export const buildCustomerSummary = (listDetail = []) => {
  const grouped = listDetail.reduce((accumulator, item) => {
    const groupKey = `${item?.cuscode || ""}__${item?.cusname || ""}`;

    if (!accumulator[groupKey]) {
      accumulator[groupKey] = {
        key: groupKey,
        cuscode: item?.cuscode || "-",
        cusname: item?.cusname || "-",
        blcodes: [],
        totalOutstanding: 0,
        nearestDueDateValue: null,
      };
    }

    const current = accumulator[groupKey];
    const grandTotal = Number(
      item?.grand_total_price ?? (Number(item?.total_price || 0) - Number(item?.discount || 0))
    );

    if (item?.blcode) {
      current.blcodes.push(item.blcode);
    }

    current.totalOutstanding += grandTotal;

    const dueDateValue = dayjs(item?.duedate).valueOf();
    if (
      item?.duedate &&
      !Number.isNaN(dueDateValue) &&
      (current.nearestDueDateValue === null || dueDateValue < current.nearestDueDateValue)
    ) {
      current.nearestDueDateValue = dueDateValue;
    }

    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((group) => ({
      key: group.key,
      cuscode: group.cuscode,
      cusname: group.cusname,
      billCount: group.blcodes.length,
      totalOutstanding: group.totalOutstanding,
      nearestDueDate: group.nearestDueDateValue ? dayjs(group.nearestDueDateValue).toISOString() : null,
      isOverdue: group.nearestDueDateValue ? group.nearestDueDateValue < dayjs().startOf("day").valueOf() : false,
    }))
    .sort((left, right) => {
      const leftKey = `${left?.cuscode || ""} ${left?.cusname || ""}`.trim();
      const rightKey = `${right?.cuscode || ""} ${right?.cusname || ""}`.trim();
      return leftKey.localeCompare(rightKey, "th");
    });
};

export const filterCustomersOverdueByMonths = (rows = [], monthsThreshold = 3) => {
  const now = dayjs();

  return rows.filter((row) => {
    if (!row?.nearestDueDate) {
      return false;
    }

    return now.diff(dayjs(row.nearestDueDate), "month") >= monthsThreshold;
  });
};

export const buildCustomerTotals = (rows = []) =>
  rows.reduce(
    (accumulator, row) => ({
      billCount: accumulator.billCount + Number(row.billCount || 0),
      totalOutstanding: accumulator.totalOutstanding + Number(row.totalOutstanding || 0),
    }),
    { billCount: 0, totalOutstanding: 0 }
  );

export const buildCustomerReportPages = (rows = []) => {
  if (rows.length < 1) {
    return [{ rows: [], includeGrandTotal: false }];
  }

  const pages = [];
  let currentRows = [];
  let currentHeight = PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE;

  const pushCurrentPage = () => {
    if (currentRows.length > 0) {
      pages.push({ rows: currentRows, includeGrandTotal: false });
    }

    currentRows = [];
    currentHeight = PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE;
  };

  rows.forEach((row) => {
    const rowHeight = estimateOutstandingRowHeight(row);

    if (currentRows.length > 0 && currentHeight + rowHeight > PAGE_HEIGHT_ESTIMATE) {
      pushCurrentPage();
    }

    currentRows.push(row);
    currentHeight += rowHeight;
  });

  if (currentRows.length > 0) {
    pages.push({ rows: currentRows, includeGrandTotal: false });
  }

  const lastPage = pages[pages.length - 1];
  const lastPageContentHeight = lastPage.rows.reduce(
    (sum, row) => sum + estimateOutstandingRowHeight(row),
    PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE
  );

  if (lastPageContentHeight + PAGE_TOTAL_ESTIMATE > PAGE_HEIGHT_ESTIMATE) {
    pages.push({ rows: [], includeGrandTotal: true });
  } else {
    lastPage.includeGrandTotal = true;
  }

  return pages;
};
