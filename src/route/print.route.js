import React from 'react'
import { Route } from 'react-router-dom'

import { QuoPrintPreview } from '../components/print'


export const PrintRouter = (<>
  <Route path="/quo-print/:code" element={<QuoPrintPreview />} />
</>)