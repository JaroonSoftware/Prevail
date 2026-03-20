import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/quotations/manage.php`, 
  API_GETMASTER: `/quotations/search.php`, 

  API_GETCODE: `/quotations/get-quotcode.php`, 
  API_CATALOG: `/quotations/get-catalog.php`,
};
  
const QuotationService = () => { 
  
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);

  const code = (config = {}) => api.get(`${API_URL.API_GETCODE}`, config);

  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_GETMASTER}`, parm, { cancle: true, ...config });
  const getcatalog = (code, config = {}) => api.get(`${API_URL.API_CATALOG}?code=${code}`, config);
  

  return {
    create,
    update,
    deleted,
    get, 
    code,
    search,
    getcatalog
  };
};

export default QuotationService;