import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_GETDRYGOODS: `/reports/drygoods/search.php`,
  API_SETDRYGOODS: `/reports/drygoods/issue.php`,
  API_GETNOODLE: `/reports/noodle/search.php`,
};
  
const ReportService = () => { 
  
  const getDryGoods = (parm = {}) => api.post(`${API_URL.API_GETDRYGOODS}`, parm);
  const setDryGoods = (parm = {}) => api.post(`${API_URL.API_SETDRYGOODS}`, parm);
  const getNoodle = (parm = {}) => api.post(`${API_URL.API_GETNOODLE}`, parm);
 

  return {
    getDryGoods,
    setDryGoods,
    getNoodle,
  };
};

export default ReportService;