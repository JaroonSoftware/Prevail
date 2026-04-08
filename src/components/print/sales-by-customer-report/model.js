import dayjs from "dayjs";

export const PAGE_COOKIE_KEY = "sales-by-customer-report";
export const CUSTOMER_REPORT_MODE = {
  NORMAL: "normal",
  RANKING: "ranking",
};

export const CUSTOMER_REPORT_GRID_TEMPLATE =
  "116px minmax(260px, 2.8fr) 160px 110px 170px";

const PAGE_HEIGHT_ESTIMATE = 530;
const PAGE_HEADER_ESTIMATE = 75;
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

  if (Array.isArray(data?.sodate) && data.sodate.length === 2) {
    const [sodate_form, sodate_to] = data.sodate.map((value) =>
      dayjs(value).format("YYYY-MM-DD")
    );
    Object.assign(data, { sodate_form, sodate_to });
  }

  delete data.sodate;
  delete data.viewMode;
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

export const estimateCustomerRowHeight = (row) => {
  const nameLines = estimateWrappedLines(row?.cusname, CUSTOMER_NAME_WRAP_LENGTH);
  return ROW_BASE_HEIGHT_ESTIMATE + (nameLines - 1) * ROW_EXTRA_LINE_HEIGHT_ESTIMATE;
};

const normalizeItem = (item) => {
  const qty = Number(item?.qty || 0);
  const price = Number(item?.price || 0);
  const vatRate = Number(item?.vat || 0);
  const lineSubtotal = Number(item?.line_subtotal ?? qty * price);
  const lineNetTotal = Number(item?.line_net_total ?? lineSubtotal * (1 + vatRate / 100));
  const lineVatAmount = Number(item?.line_vat_amount ?? lineNetTotal - lineSubtotal);

  return {
    ...item,
    qty,
    price,
    vatRate,
    lineSubtotal,
    lineNetTotal,
    lineVatAmount,
  };
};

export const buildCustomerSummary = (listDetail = [], options = {}) => {
  const { mode = CUSTOMER_REPORT_MODE.NORMAL } = options;
  const grouped = listDetail.reduce((accumulator, rawItem) => {
    const item = normalizeItem(rawItem);
    const groupKey = `${item?.cuscode || ""}__${item?.cusname || ""}`;

    if (!accumulator[groupKey]) {
      accumulator[groupKey] = {
        key: groupKey,
        cuscode: item?.cuscode || "-",
        cusname: item?.cusname || "-",
        invoiceCodes: new Set(),
        totalQty: 0,
        totalSubtotal: 0,
        totalVatAmount: 0,
        totalNet: 0,
        lastSaleDateValue: 0,
      };
    }

    const current = accumulator[groupKey];

    if (item?.socode) {
      current.invoiceCodes.add(item.socode);
    }

    current.totalQty += item.qty;
    current.totalSubtotal += item.lineSubtotal;
    current.totalVatAmount += item.lineVatAmount;
    current.totalNet += item.lineNetTotal;

    const saleDateValue = dayjs(item?.sodate).valueOf() || 0;
    if (saleDateValue > current.lastSaleDateValue) {
      current.lastSaleDateValue = saleDateValue;
    }

    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((group) => ({
      key: group.key,
      cuscode: group.cuscode,
      cusname: group.cusname,
      invoiceCount: group.invoiceCodes.size,
      totalQty: group.totalQty,
      totalSubtotal: group.totalSubtotal,
      totalVatAmount: group.totalVatAmount,
      totalNet: group.totalNet,
      lastSaleDate: group.lastSaleDateValue ? dayjs(group.lastSaleDateValue).toISOString() : null,
    }))
    .sort((left, right) => {
      if (mode === CUSTOMER_REPORT_MODE.RANKING) {
        const netDiff = Number(right?.totalNet || 0) - Number(left?.totalNet || 0);
        if (netDiff !== 0) {
          return netDiff;
        }

        const subtotalDiff = Number(right?.totalSubtotal || 0) - Number(left?.totalSubtotal || 0);
        if (subtotalDiff !== 0) {
          return subtotalDiff;
        }
      }

      const leftKey = `${left?.cuscode || ""} ${left?.cusname || ""}`.trim();
      const rightKey = `${right?.cuscode || ""} ${right?.cusname || ""}`.trim();
      return leftKey.localeCompare(rightKey, "th");
    });
};

export const getCustomerReportTitle = (mode = CUSTOMER_REPORT_MODE.NORMAL) =>
  mode === CUSTOMER_REPORT_MODE.RANKING
    ? "รายงานจัดอันดับยอดขายตามลูกค้า"
    : "รายงานยอดขายตามลูกค้า";

export const buildCustomerTotals = (rows = []) =>
  rows.reduce(
    (accumulator, row) => ({
      invoiceCount: accumulator.invoiceCount + Number(row.invoiceCount || 0),
      totalQty: accumulator.totalQty + Number(row.totalQty || 0),
      totalSubtotal: accumulator.totalSubtotal + Number(row.totalSubtotal || 0),
      totalVatAmount: accumulator.totalVatAmount + Number(row.totalVatAmount || 0),
      totalNet: accumulator.totalNet + Number(row.totalNet || 0),
    }),
    { invoiceCount: 0, totalQty: 0, totalSubtotal: 0, totalVatAmount: 0, totalNet: 0 }
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
    const rowHeight = estimateCustomerRowHeight(row);

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
    (sum, row) => sum + estimateCustomerRowHeight(row),
    PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE
  );

  if (lastPageContentHeight + PAGE_TOTAL_ESTIMATE > PAGE_HEIGHT_ESTIMATE) {
    pages.push({ rows: [], includeGrandTotal: true });
  } else {
    lastPage.includeGrandTotal = true;
  }

  return pages;
};