import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/billing/manage.php`, 
  API_SEARCH: `/billing/search.php`, 
  API_LIST: `/billing/list.php`, 
  API_GETCODE: `/billing/get-blcode.php`, 
};
  
const BillingNoteService = () => { 
  
  const create = (parm = {}) => api.post(`${API_URL.API_MANAGE}`, parm);
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm);
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`);
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`);
  const getlist = (parm = {}) => api.post(`${API_URL.API_LIST}`, parm);
  const code = () => api.get(`${API_URL.API_GETCODE}`);

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