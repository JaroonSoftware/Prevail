import React, {useEffect} from 'react'
import { Outlet } from 'react-router-dom'
function GoodsReceipt() {
  useEffect(() => {
      
    return () => { };
  }, []);
  return (<div className='layout-content px-3 sm:px-5 md:px-5'><Outlet /></div>)
}

export default GoodsReceipt