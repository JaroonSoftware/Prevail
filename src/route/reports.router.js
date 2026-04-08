import React from "react";
import { Route } from "react-router-dom";

import { DryGoodsSelector } from "../pages/reports/dry-report";
import { CurryPasteReport } from "../pages/reports/curry-paste-report";
import { FruitReport } from "../pages/reports/fruit-report";
import { NoodleReport } from "../pages/reports/noodle-report";
import { BestSellingProductReport } from "../pages/reports/best-selling-product-report";
import { SalesByCustomerReport } from "../pages/reports/sales-by-customer-report";
import { SalesByProductReport } from "../pages/reports/sales-by-product-report";

export const ReportRouter = (
  <>
    <Route path="/so-by-product-report" element={<SalesByProductReport />} />
    <Route path="/best-selling-product-report" element={<BestSellingProductReport />} />
    <Route path="/so-by-customer-report" element={<SalesByCustomerReport />} />
    <Route path="/dry-report" element={<DryGoodsSelector />} />
    <Route path="/curry-paste-report" element={<CurryPasteReport />} />
    <Route path="/fruit-report" element={<FruitReport />} />
    <Route path="/noodle-report" element={<NoodleReport />} />
  </>
);
