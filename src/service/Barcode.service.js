import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_SHIPPING: `/barcode/verify-shipping.php`, 
};

const BarcodeService = () => { 
  
  const getshipping = (code, conf = {}) => api.get(`${API_URL.API_SHIPPING}?code=${code}`, conf);

  return {
    getshipping,
  };
};

export default BarcodeService;