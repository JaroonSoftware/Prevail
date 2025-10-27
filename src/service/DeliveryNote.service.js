import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/deliverynote/manage.php`, 
  API_SEARCH: `/deliverynote/search.php`, 
  API_GETCODE: `/deliverynote/get-doc-code.php`, 
  API_LIST: `/deliverynote/list.php`, 
  API_DELIVERY_NOTE: `/deliverynote/deliverynote-print.php`, 
  API_ISSUE: `/deliverynote/issue.php`,
  API_GETDETAIL: `/deliverynote/getdetail.php`, 
};
 

const DeliveryNoteService = () => { 
  
  const create = (parm = {}) => api.post(`${API_URL.API_MANAGE}`, parm);
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm);
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`);
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`);
  const getlist = (parm = {}) => api.post(`${API_URL.API_LIST}`, parm);
  const getPrint = (code) => api.get(`${API_URL.API_DELIVERY_NOTE}?code=${code}`);
  const code = () => api.get(`${API_URL.API_GETCODE}`);
  const search = (parm = {}) => api.post(`${API_URL.API_SEARCH}`, parm, { cancle: true, ignoreLoading : true});
  const issue = (code) => api.get(`${API_URL.API_ISSUE}?code=${code}`);
  const getdetail_for_issue = (parm = {}) => api.post(`${API_URL.API_GETDETAIL}`, parm);
  

  return {
    create,
    update,
    deleted,
    get,
    getlist,
    getPrint,
    code,
    search,
    issue,
    getdetail_for_issue
  };
};

export default DeliveryNoteService;