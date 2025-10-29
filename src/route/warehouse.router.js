
import { Route } from "react-router-dom";

import {
  Quotation,
  QuotationAccess,
  QuotationManage,
  QuotationOrder,
  QuotationView,
} from "../pages/quotation";

import { PurchaseOrder, PurchaseOrderAccess, PurchaseOrderManage,PurchaseOrderView } from "../pages/purchase-order";

import { GoodsReceipt, GoodsReceiptAccess, GoodsReceiptManage } from "../pages/goods-receipt";

import { PrintWeight, PrintWeightAccess, PrintWeightManage } from "../pages/print-package";

import { SO, SOAccess, SOManage,SOView } from "../pages/so";

import { DN, DNAccess, DNManage,DNView } from "../pages/delivery-note";

import { BL, BLAccess, BLManage,BLView } from "../pages/billing";

import { Receipt, ReceiptAccess, ReceiptManage,ReceiptView } from "../pages/receipt";

import { Shipping, ShippingAccess } from "../pages/shipping";

import { County, CountyAccess, CountyManage } from "../pages/county";

export const WarehouseRouter = (
  <>
    <Route path="/quotation/" exact element={<Quotation />}>
      <Route index element={<QuotationAccess />} />
      <Route path="manage/:action" element={<QuotationManage />} />
      <Route path="order" element={<QuotationOrder />} />
      <Route path="view" element={<QuotationView />} />
    </Route>

    <Route path="/purchase-order/" exact element={<PurchaseOrder />}>
      <Route index element={<PurchaseOrderAccess />} />
      <Route path="manage/:action" element={<PurchaseOrderManage />} />
      <Route path="view" element={<PurchaseOrderView />} />
    </Route>

    <Route path="/goods-receipt/" exact element={<GoodsReceipt />}>
      <Route index element={<GoodsReceiptAccess />} />
      <Route path="manage/:action" element={<GoodsReceiptManage />} />
    </Route>

    <Route path="/print-weight/" exact element={<PrintWeight />}>
      <Route index element={<PrintWeightAccess />} />
      <Route path="manage/:action" element={<PrintWeightManage />} />
    </Route>

    <Route path="/sales-order/" exact element={<SO />}>
      <Route index element={<SOAccess />} />
      <Route path="manage/:action" element={<SOManage />} />
      <Route path="view" element={<SOView />} />
    </Route>

    <Route path="/delivery-note/" exact element={<DN />}>
      <Route index element={<DNAccess />} />
      <Route path="manage/:action" element={<DNManage />} />
      <Route path="view" element={<DNView />} />
    </Route>

    <Route path="/billing/" exact element={<BL />}>
      <Route index element={<BLAccess />} />
      <Route path="manage/:action" element={<BLManage />} />
      <Route path="view" element={<BLView />} />
    </Route>

    <Route path="/receipt/" exact element={<Receipt />}>
      <Route index element={<ReceiptAccess />} />
      <Route path="manage/:action" element={<ReceiptManage />} />
      <Route path="view" element={<ReceiptView />} />
    </Route>

    <Route path="/shipping/" exact element={<Shipping />}>
      <Route index element={<ShippingAccess />} />
    </Route>

    <Route path="/shipping/" exact element={<Shipping />}>
      <Route index element={<ShippingAccess />} />
    </Route>

    <Route path="/county/" exact element={<County />}>
      <Route index element={<CountyAccess />} />
      <Route path="manage/:action" element={<CountyManage />} />
    </Route>
  </>
);
