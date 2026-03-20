import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_GETDRYGOODS: `/reports/drygoods/search.php`,
  API_SETDRYGOODS: `/reports/drygoods/issue.php`,
  API_GETNOODLE: `/reports/noodle/search.php`,
};
  
const ReportService = () => { 
  
  const getDryGoods = (parm = {}, config = {}) => api.post(`${API_URL.API_GETDRYGOODS}`, parm, config);
  const setDryGoods = (parm = {}, config = {}) => api.post(`${API_URL.API_SETDRYGOODS}`, parm, config);
  const getNoodle = (parm = {}, config = {}) => api.post(`${API_URL.API_GETNOODLE}`, parm, config);
 

  return {
    getDryGoods,
    setDryGoods,
    getNoodle,
  };
};

export default ReportService;