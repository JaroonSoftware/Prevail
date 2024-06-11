import React from "react";
import { Route } from "react-router-dom";

import {
  Quotation,
  QuotationAccess,
  QuotationManage,
} from "../pages/quotation";

import { SO, SOAccess, SOManage } from "../pages/so";

import { Receipt, ReceiptAccess, ReceiptManage } from "../pages/receipt";

export const WarehouseRouter = (
  <>
    <Route path="/quotation/" exact element={<Quotation />}>
      <Route index element={<QuotationAccess />} />
      <Route path="manage/:action" element={<QuotationManage />} />
    </Route>

    <Route path="/so/" exact element={<SO />}>
      <Route index element={<SOAccess />} />
      <Route path="manage/:action" element={<SOManage />} />
    </Route>

    <Route path="/receipt/" exact element={<Receipt />}>
      <Route index element={<ReceiptAccess />} />
      <Route path="manage/:action" element={<ReceiptManage />} />
    </Route>
  </>
);
