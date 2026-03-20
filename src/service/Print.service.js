import { requestService as api, getParmeter } from "./Request.service"  
const API_URL = {
  PRINT_QUOTATION: `/print/quotation.php`,
};
 

const PrintService = () => {
  //quotation
  // const quotation = (parm = {}) => api.get(`${API_URL.PRINT_QUOTATION}?${getParmeter(parm)}`, { ignoreLoading : true });
  const quotation = (code, config = {}) => api.get(`${API_URL.PRINT_QUOTATION}?code=${code}`, config);
  return {    
    quotation
  };
};

export default PrintService;