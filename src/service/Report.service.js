import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_GETDRYGOODS: `/reports/drygoods/search.php`,
  API_SETDRYGOODS: `/reports/drygoods/issue.php`,
  API_GETNOODLE: `/reports/noodle/search.php`,
  API_GETFRUIT: `/reports/fruit/search.php`,
  API_GETSALESBYPRODUCT: `/reports/sales-by-product/search.php`,
};
  
const ReportService = () => { 
  
  const getDryGoods = (parm = {}, config = {}) => api.post(`${API_URL.API_GETDRYGOODS}`, parm, config);
  const setDryGoods = (parm = {}, config = {}) => api.post(`${API_URL.API_SETDRYGOODS}`, parm, config);
  const getNoodle = (parm = {}, config = {}) => api.post(`${API_URL.API_GETNOODLE}`, parm, config);
  const getFruit = (parm = {}, config = {}) => api.post(`${API_URL.API_GETFRUIT}`, parm, config);
  const getSalesByProduct = (parm = {}, config = {}) => api.post(`${API_URL.API_GETSALESBYPRODUCT}`, parm, config);
 

  return {
    getDryGoods,
    setDryGoods,
    getNoodle,
    getFruit,
    getSalesByProduct,
  };
};

export default ReportService;