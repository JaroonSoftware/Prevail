import React from "react";
import { Route } from "react-router-dom";

import { DryGoodsSelector } from "../pages/reports/dry-report";
import { FruitReport } from "../pages/reports/fruit-report";
import { NoodleReport } from "../pages/reports/noodle-report";

export const ReportRouter = (
  <>
    <Route path="/dry-report" element={<DryGoodsSelector />} />
    <Route path="/fruit-report" element={<FruitReport />} />
    <Route path="/noodle-report" element={<NoodleReport />} />
  </>
);
