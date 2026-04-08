import dayjs from "dayjs";

export const PAGE_COOKIE_KEY = "profit-by-product-customer-report";
export const REPORT_GRID_TEMPLATE =
  "minmax(84px, 0.82fr) minmax(280px, 3.35fr) minmax(62px, 0.56fr) minmax(76px, 0.66fr) minmax(108px, 0.9fr) minmax(108px, 0.9fr) minmax(108px, 0.9fr)";

const PAGE_HEIGHT_ESTIMATE = 530;
const PAGE_HEADER_ESTIMATE = 75;
const PAGE_COLUMN_HEADER_ESTIMATE = 36;
const PAGE_TOTAL_ESTIMATE = 44;
const GROUP_MARGIN_ESTIMATE = 14;
const GROUP_TITLE_ESTIMATE = 20;
const GROUP_SUMMARY_ESTIMATE = 32;
const ROW_BASE_HEIGHT_ESTIMATE = 20;
const ROW_EXTRA_LINE_HEIGHT_ESTIMATE = 10;
const CUSTOMER_NAME_WRAP_LENGTH = 40;
const CUSTOMER_CODE_WRAP_LENGTH = 14;
const GROUP_TITLE_WRAP_LENGTH = 38;

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

const normalizeItem = (item) => {
  const qty = Number(item?.qty || 0);
  const price = Number(item?.price || 0);
  const vatRate = Number(item?.vat || 0);
  const lineSubtotal = Number(item?.line_subtotal ?? qty * price);
  const lineNetTotal = Number(item?.line_net_total ?? lineSubtotal * (1 + vatRate / 100));
  const lineCostTotal = Number(
    item?.line_cost_total ?? item?.total_cost ?? qty * Number(item?.buyprice || 0)
  );
  const lineProfitTotal = Number(item?.line_profit_total ?? lineNetTotal - lineCostTotal);

  return {
    ...item,
    qty,
    price,
    vatRate,
    lineSubtotal,
    lineNetTotal,
    lineCostTotal,
    lineProfitTotal,
  };
};

export const buildProductCustomerSummary = (listDetail = []) => {
  const grouped = listDetail.reduce((accumulator, rawItem) => {
    const item = normalizeItem(rawItem);
    const productKey = [item?.stcode || "", item?.stname || "", item?.unit || ""].join("__");

    if (!accumulator[productKey]) {
      accumulator[productKey] = {
        key: productKey,
        stcode: item?.stcode || "-",
        stname: item?.stname || "-",
        unit: item?.unit || "-",
        customers: {},
        totalQty: 0,
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
      };
    }

    const productGroup = accumulator[productKey];
    const customerKey = `${item?.cuscode || ""}__${item?.cusname || ""}`;

    if (!productGroup.customers[customerKey]) {
      productGroup.customers[customerKey] = {
        key: `${productKey}__${customerKey}`,
        cuscode: item?.cuscode || "-",
        cusname: item?.cusname || "-",
        invoiceCodes: new Set(),
        totalQty: 0,
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
      };
    }

    const customer = productGroup.customers[customerKey];

    if (item?.socode) {
      customer.invoiceCodes.add(item.socode);
    }

    customer.totalQty += item.qty;
    customer.totalSales += item.lineNetTotal;
    customer.totalCost += item.lineCostTotal;
    customer.totalProfit += item.lineProfitTotal;

    productGroup.totalQty += item.qty;
    productGroup.totalSales += item.lineNetTotal;
    productGroup.totalCost += item.lineCostTotal;
    productGroup.totalProfit += item.lineProfitTotal;

    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((productGroup) => {
      const customers = Object.values(productGroup.customers)
        .map((customer) => ({
          key: customer.key,
          cuscode: customer.cuscode,
          cusname: customer.cusname,
          invoiceCount: customer.invoiceCodes.size,
          totalQty: customer.totalQty,
          totalSales: customer.totalSales,
          totalCost: customer.totalCost,
          totalProfit: customer.totalProfit,
          profitMargin: customer.totalSales > 0 ? (customer.totalProfit / customer.totalSales) * 100 : 0,
        }))
        .sort((left, right) => {
          const leftKey = `${left?.cuscode || ""} ${left?.cusname || ""}`.trim();
          const rightKey = `${right?.cuscode || ""} ${right?.cusname || ""}`.trim();
          return leftKey.localeCompare(rightKey, "th");
        });

      return {
        key: productGroup.key,
        stcode: productGroup.stcode,
        stname: productGroup.stname,
        unit: productGroup.unit,
        customers,
        totalQty: productGroup.totalQty,
        totalSales: productGroup.totalSales,
        totalCost: productGroup.totalCost,
        totalProfit: productGroup.totalProfit,
        profitMargin:
          productGroup.totalSales > 0 ? (productGroup.totalProfit / productGroup.totalSales) * 100 : 0,
      };
    })
    .sort((left, right) => {
      const leftKey = `${left?.stname || ""} ${left?.stcode || ""}`.trim();
      const rightKey = `${right?.stname || ""} ${right?.stcode || ""}`.trim();
      return leftKey.localeCompare(rightKey, "th");
    });
};

export const buildReportTotals = (groups = []) =>
  groups.reduce(
    (accumulator, group) => ({
      totalQty: accumulator.totalQty + Number(group.totalQty || 0),
      totalSales: accumulator.totalSales + Number(group.totalSales || 0),
      totalCost: accumulator.totalCost + Number(group.totalCost || 0),
      totalProfit: accumulator.totalProfit + Number(group.totalProfit || 0),
    }),
    { totalQty: 0, totalSales: 0, totalCost: 0, totalProfit: 0 }
  );

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

export const estimateCustomerProfitRowHeight = (row) => {
  const nameLines = estimateWrappedLines(row?.cusname, CUSTOMER_NAME_WRAP_LENGTH);
  const codeLines = estimateWrappedLines(row?.cuscode, CUSTOMER_CODE_WRAP_LENGTH);
  const textLines = Math.max(nameLines, codeLines);

  return ROW_BASE_HEIGHT_ESTIMATE + (textLines - 1) * ROW_EXTRA_LINE_HEIGHT_ESTIMATE;
};

export const estimateProfitGroupTitleHeight = (group) => {
  const titleLines = estimateWrappedLines(
    `${group?.stname || ""} ${group?.stcode || ""}`,
    GROUP_TITLE_WRAP_LENGTH
  );

  return GROUP_TITLE_ESTIMATE + (titleLines - 1) * ROW_EXTRA_LINE_HEIGHT_ESTIMATE;
};

export const buildProfitReportPages = (groups = []) => {
  if (groups.length < 1) {
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

  groups.forEach((group) => {
    const titleHeight = estimateProfitGroupTitleHeight(group);
    let section = null;

    const startSection = (continuedFromPrevious) => {
      const minimumGroupHeight = GROUP_MARGIN_ESTIMATE + titleHeight + ROW_BASE_HEIGHT_ESTIMATE;

      if (currentSections.length > 0 && currentHeight + minimumGroupHeight > PAGE_HEIGHT_ESTIMATE) {
        pushCurrentPage();
      }

      section = {
        key: `${group.key}-${currentSections.length}`,
        stcode: group.stcode,
        stname: group.stname,
        unit: group.unit,
        customers: [],
        totalQty: group.totalQty,
        totalSales: group.totalSales,
        totalCost: group.totalCost,
        totalProfit: group.totalProfit,
        showSummary: false,
        continuedFromPrevious,
        continuesToNext: false,
      };

      currentSections.push(section);
      currentHeight += GROUP_MARGIN_ESTIMATE + titleHeight;
    };

    group.customers.forEach((customer, index) => {
      const rowHeight = estimateCustomerProfitRowHeight(customer);
      const isLastRow = index === group.customers.length - 1;
      const requiredHeight = rowHeight + (isLastRow ? GROUP_SUMMARY_ESTIMATE : 0);

      if (!section) {
        startSection(false);
      }

      if (section.customers.length > 0 && currentHeight + requiredHeight > PAGE_HEIGHT_ESTIMATE) {
        section.continuesToNext = true;
        pushCurrentPage();
        startSection(true);
      }

      section.customers.push(customer);
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
    const sectionRowsHeight = section.customers.reduce(
      (rowSum, row) => rowSum + estimateCustomerProfitRowHeight(row),
      0
    );

    return (
      sum +
      GROUP_MARGIN_ESTIMATE +
      estimateProfitGroupTitleHeight(section) +
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
};