import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_SHIPPING: `/barcode/verify-shipping.php`, 
};

const BarcodeService = () => { 
  
  const getshipping = (code, config = {}) => api.get(`${API_URL.API_SHIPPING}?code=${code}`, { ignoreLoading : true, ...config });
  const confirm_shipping = (parm = {}, config = {}) => api.put(`${API_URL.API_SHIPPING}`, parm, config);
  return {
    getshipping,
    confirm_shipping
  };
};

export default BarcodeService;