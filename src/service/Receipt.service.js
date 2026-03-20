import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/receipt/manage.php`, 
  API_PRINT: `/receipt/print.php`, 
  API_SEARCH: `/receipt/search.php`, 

  API_GETCODE: `/receipt/get-recode.php`, 
};
  
const ReceiptService = () => { 
  
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);

  const code = (config = {}) => api.get(`${API_URL.API_GETCODE}`, config);
  const getprint = (code, config = {}) => api.get(`${API_URL.API_PRINT}?code=${code}`, config);
  
  // const search = (parm = {}, config = {}) => api.post(`${API_URL.API_GETMASTER}`, parm);
  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});

  return {
    create,
    update,
    deleted,
    get, 

    code,
    getprint,
    search,
  };
};

export default ReceiptService;