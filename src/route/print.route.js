import React from 'react'
import { Route } from 'react-router-dom'

import { QuoPrintPreview,PrintWeightListPrint } from '../components/print'


export const PrintRouter = (<>
  <Route path="/quo-print/:code" element={<QuoPrintPreview />} />
  <Route path="/print-weight/:code" element={<PrintWeightListPrint />} />
  
</>)