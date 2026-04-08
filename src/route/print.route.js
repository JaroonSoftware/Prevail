import React from 'react'
import { Route } from 'react-router-dom'

import { QuoPrintPreview,PrintWeightListPrint,BLPrintPreview,ReceiptPrintPreview,DeliveryPrintPreview,SOPrintPreview,DryReportPrintPreview,FruitReportPrintPreview,CurryPasteReportPrintPreview,NoodleReportPrintPreview,SalesByProductPrintPreview,SalesByCustomerPrintPreview,BestSellingProductPrintPreview } from '../components/print'


export const PrintRouter = (<>
  <Route path="/quo-print/:code" element={<QuoPrintPreview />} />
  <Route path="/print-weight/:code" element={<PrintWeightListPrint />} />
  <Route path="/bl-print/:code" element={<BLPrintPreview />} />
  <Route path="/re-print/:code" element={<ReceiptPrintPreview />} />
  <Route path="/dn-print/:code" element={<DeliveryPrintPreview />} />
  <Route path="/so-print/:code" element={<SOPrintPreview />} />
  <Route path="/dry-report-print" element={<DryReportPrintPreview />} />
  <Route path="/dry-report-print/:code" element={<DryReportPrintPreview />} />
  <Route path="/fruit-report-print" element={<FruitReportPrintPreview />} />
  <Route path="/curry-paste-report-print" element={<CurryPasteReportPrintPreview />} />
  <Route path="/noodle-report-print" element={<NoodleReportPrintPreview />} />
  <Route path="/sales-by-product-print" element={<SalesByProductPrintPreview />} />
  <Route path="/sales-by-customer-print" element={<SalesByCustomerPrintPreview />} />
  <Route path="/best-selling-product-print" element={<BestSellingProductPrintPreview />} />
</>)