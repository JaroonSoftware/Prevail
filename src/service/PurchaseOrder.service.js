import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/purchaseorder/manage.php`, 
  API_SEARCH: `/purchaseorder/search.php`, 

  API_GETCODE: `/purchaseorder/get-doc-code.php`, 
};
  
const QuotationService = () => { 
  
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);

  const code = (config = {}) => api.get(`${API_URL.API_GETCODE}`, config);

  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});
  

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