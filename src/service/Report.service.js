import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_GETDRYGOODS: `/reports/drygoods/search.php`,
  API_SETDRYGOODS: `/reports/drygoods/issue.php`,
  API_GETNOODLE: `/reports/noodle/search.php`,
  API_GETSPECIALDRY: `/reports/special-dry/search.php`,
  API_GETFRUIT: `/reports/fruit/search.php`,
  API_GETCURRY: `/reports/curry/search.php`,
  API_GETSALESBYPRODUCT: `/reports/sales-by-product/search.php`,
  API_GETSALESBYCUSTOMER: `/reports/sales-by-product/search.php`,
  API_GETPROFITBYPRODUCTCUSTOMER: `/reports/profit-by-product-customer/search.php`,
};
  
const ReportService = () => { 
  
  const getDryGoods = (parm = {}, config = {}) => api.post(`${API_URL.API_GETDRYGOODS}`, parm, config);
  const setDryGoods = (parm = {}, config = {}) => api.post(`${API_URL.API_SETDRYGOODS}`, parm, config);
  const getNoodle = (parm = {}, config = {}) => api.post(`${API_URL.API_GETNOODLE}`, parm, config);
  const getSpecialDry = (parm = {}, config = {}) => api.post(`${API_URL.API_GETSPECIALDRY}`, parm, config);
  const getFruit = (parm = {}, config = {}) => api.post(`${API_URL.API_GETFRUIT}`, parm, config);
  const getCurry = (parm = {}, config = {}) => api.post(`${API_URL.API_GETCURRY}`, parm, config);
  const getSalesByProduct = (parm = {}, config = {}) => api.post(`${API_URL.API_GETSALESBYPRODUCT}`, parm, config);
  const getSalesByCustomer = (parm = {}, config = {}) => api.post(`${API_URL.API_GETSALESBYCUSTOMER}`, parm, config);
  const getProfitByProductCustomer = (parm = {}, config = {}) => api.post(`${API_URL.API_GETPROFITBYPRODUCTCUSTOMER}`, parm, config);
 

  return {
    getDryGoods,
    setDryGoods,
    getNoodle,
    getSpecialDry,
    getFruit,
    getCurry,
    getSalesByProduct,
    getSalesByCustomer,
    getProfitByProductCustomer,
  };
};

export default ReportService;