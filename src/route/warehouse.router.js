import React from "react";
import { Route } from "react-router-dom";

import {
  Quotation,
  QuotationAccess,
  QuotationManage,
} from "../pages/quotation";

import { PurchaseOrder, PurchaseOrderAccess, PurchaseOrderManage } from "../pages/purchase-order";

import { GoodsReceipt, GoodsReceiptAccess, GoodsReceiptManage } from "../pages/goods-receipt";

import { SO, SOAccess, SOManage } from "../pages/so";

import { Receipt, ReceiptAccess, ReceiptManage } from "../pages/receipt";

export const WarehouseRouter = (
  <>
    <Route path="/quotation/" exact element={<Quotation />}>
      <Route index element={<QuotationAccess />} />
      <Route path="manage/:action" element={<QuotationManage />} />
    </Route>

    <Route path="/purchase-order/" exact element={<PurchaseOrder />}>
      <Route index element={<PurchaseOrderAccess />} />
      <Route path="manage/:action" element={<PurchaseOrderManage />} />
    </Route>

    <Route path="/goods-receipt/" exact element={<GoodsReceipt />}>
      <Route index element={<GoodsReceiptAccess />} />
      <Route path="manage/:action" element={<GoodsReceiptManage />} />
    </Route>

    <Route path="/sales-order/" exact element={<SO />}>
      <Route index element={<SOAccess />} />
      <Route path="manage/:action" element={<SOManage />} />
    </Route>

    <Route path="/receipt/" exact element={<Receipt />}>
      <Route index element={<ReceiptAccess />} />
      <Route path="manage/:action" element={<ReceiptManage />} />
    </Route>
  </>
);
