import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/billing/manage.php`, 
  API_SEARCH: `/billing/search.php`, 
  API_LIST: `/billing/list.php`, 
  API_GETCODE: `/billing/get-blcode.php`, 
};
  
const BillingNoteService = () => { 
  
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);
  const getlist = (parm = {}, config = {}) => api.post(`${API_URL.API_LIST}`, parm, config);
  const code = (config = {}) => api.get(`${API_URL.API_GETCODE}`, config);

  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});
  

  return {
    create,
    update,
    deleted,
    get, 
    getlist,
    code,

    search,
  };
};

export default BillingNoteService;