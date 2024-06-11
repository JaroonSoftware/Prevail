import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/quotations/manage.php`, 
  API_GETMASTER: `/quotations/search.php`, 

  API_GETCODE: `/quotations/get-quotcode.php`, 
};
  
const QuotationService = () => { 
  
  const create = (parm = {}) => api.post(`${API_URL.API_MANAGE}`, parm);
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm);
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`);
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`);

  const code = () => api.get(`${API_URL.API_GETCODE}`);

  const search = (parm = {}) => api.post(`${API_URL.API_GETMASTER}`, parm);
  

  return {
    create,
    update,
    deleted,
    get, 

    code,

    search,
  };
};

export default QuotationService;