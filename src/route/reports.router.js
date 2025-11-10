import React from "react";
import { Route } from "react-router-dom";

import { DryGoodsSelector } from "../pages/reports/dry-report";

export const ReportRouter = (
  <>
    <Route path="/dry-report" element={<DryGoodsSelector />} />
  </>
);
