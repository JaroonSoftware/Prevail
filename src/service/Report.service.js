import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_GETDRYGOODS: `/reports/drygoods/search.php`,
  API_SETDRYGOODS: `/reports/drygoods/manage.php`,
};
  
const ReportService = () => { 
  
  const getDryGoods = (parm = {}) => api.post(`${API_URL.API_GETDRYGOODS}`, parm);
  const setDryGoods = (parm = {}) => api.post(`${API_URL.API_SETDRYGOODS}`, parm);
 

  return {
    getDryGoods,
    setDryGoods,
  };
};

export default ReportService;