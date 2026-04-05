import dayjs from "dayjs";

export const PAGE_COOKIE_KEY = "best-selling-product-report";
export const BEST_SELLING_PRODUCT_GRID_TEMPLATE = "64px 118px 2.8fr 92px 140px 170px";

const PAGE_HEIGHT_ESTIMATE = 742;
const PAGE_HEADER_ESTIMATE = 82;
const PAGE_COLUMN_HEADER_ESTIMATE = 36;
const PAGE_TOTAL_ESTIMATE = 44;
const ROW_BASE_HEIGHT_ESTIMATE = 22;
const ROW_EXTRA_LINE_HEIGHT_ESTIMATE = 10;
const PRODUCT_NAME_WRAP_LENGTH = 34;

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

export const estimateBestSellingRowHeight = (row) => {
  const nameLines = estimateWrappedLines(row?.stname, PRODUCT_NAME_WRAP_LENGTH);
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

export const buildBestSellingProductSummary = (listDetail = []) => {
  const grouped = listDetail.reduce((accumulator, rawItem) => {
    const item = normalizeItem(rawItem);
    const groupKey = `${item?.stcode || ""}__${item?.stname || ""}__${item?.unit || ""}`;

    if (!accumulator[groupKey]) {
      accumulator[groupKey] = {
        key: groupKey,
        stcode: item?.stcode || "-",
        stname: item?.stname || "-",
        unit: item?.unit || "-",
        invoiceCodes: new Set(),
        totalQty: 0,
        totalSubtotal: 0,
        totalVatAmount: 0,
        totalNet: 0,
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

    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((group) => ({
      key: group.key,
      stcode: group.stcode,
      stname: group.stname,
      unit: group.unit,
      invoiceCount: group.invoiceCodes.size,
      totalQty: group.totalQty,
      totalSubtotal: group.totalSubtotal,
      totalVatAmount: group.totalVatAmount,
      totalNet: group.totalNet,
    }))
    .sort((left, right) => {
      const netDiff = Number(right?.totalNet || 0) - Number(left?.totalNet || 0);
      if (netDiff !== 0) {
        return netDiff;
      }

      const subtotalDiff = Number(right?.totalSubtotal || 0) - Number(left?.totalSubtotal || 0);
      if (subtotalDiff !== 0) {
        return subtotalDiff;
      }

      const qtyDiff = Number(right?.totalQty || 0) - Number(left?.totalQty || 0);
      if (qtyDiff !== 0) {
        return qtyDiff;
      }

      const leftKey = `${left?.stcode || ""} ${left?.stname || ""}`.trim();
      const rightKey = `${right?.stcode || ""} ${right?.stname || ""}`.trim();
      return leftKey.localeCompare(rightKey, "th");
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
};

export const buildBestSellingTotals = (rows = []) =>
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

export const buildBestSellingPages = (rows = []) => {
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
    const rowHeight = estimateBestSellingRowHeight(row);

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
    (sum, row) => sum + estimateBestSellingRowHeight(row),
    PAGE_HEADER_ESTIMATE + PAGE_COLUMN_HEADER_ESTIMATE
  );

  if (lastPageContentHeight + PAGE_TOTAL_ESTIMATE > PAGE_HEIGHT_ESTIMATE) {
    pages.push({ rows: [], includeGrandTotal: true });
  } else {
    lastPage.includeGrandTotal = true;
  }

  return pages;
};

export const BEST_SELLING_REPORT_TITLE = "รายงานยอดขายแยกตามสินค้าขายดี";