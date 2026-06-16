import React from "react";
import { Route } from "react-router-dom";

import { DryGoodsSelector } from "../pages/reports/dry-report";
import { CurryPasteReport } from "../pages/reports/curry-paste-report";
import { FruitReport } from "../pages/reports/fruit-report";
import { NoodleReport } from "../pages/reports/noodle-report";
import { FreshReport } from "../pages/reports/fresh-report";
import { SpecialDryReport } from "../pages/reports/special-dry-report";
import { BestSellingProductReport } from "../pages/reports/best-selling-product-report";
import { ProfitByProductCustomerReport } from "../pages/reports/profit-by-product-customer-report";
import { SalesByCustomerReport } from "../pages/reports/sales-by-customer-report";
import { SalesByProductReport } from "../pages/reports/sales-by-product-report";
import { OutstandingByCustomerReport } from "../pages/reports/outstanding-by-customer-report";

export const ReportRouter = (
  <>
    <Route path="/so-by-product-report" element={<SalesByProductReport />} />
    <Route path="/profit-by-product-customer-report" element={<ProfitByProductCustomerReport />} />
    <Route path="/best-selling-product-report" element={<BestSellingProductReport />} />
    <Route path="/so-by-customer-report" element={<SalesByCustomerReport />} />
    <Route path="/dry-report" element={<DryGoodsSelector />} />
    <Route path="/special-dry-report" element={<SpecialDryReport />} />
    <Route path="/curry-paste-report" element={<CurryPasteReport />} />
    <Route path="/fruit-report" element={<FruitReport />} />
    <Route path="/noodle-report" element={<NoodleReport />} />
    <Route path="/fresh-report" element={<FreshReport />} />
    <Route path="/outstanding-by-customer-report" element={<OutstandingByCustomerReport />} />
  </>
);
