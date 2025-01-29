import React from 'react'
import { Route } from 'react-router-dom'

import { QuoPrintPreview,PrintWeightListPrint,BLPrintPreview,ReceiptPrintPreview } from '../components/print'


export const PrintRouter = (<>
  <Route path="/quo-print/:code" element={<QuoPrintPreview />} />
  <Route path="/print-weight/:code" element={<PrintWeightListPrint />} />
  <Route path="/bl-print/:code" element={<BLPrintPreview />} />
  <Route path="/re-print/:code" element={<ReceiptPrintPreview />} />
</>)