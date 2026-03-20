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
  
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);
  const getlist = (parm = {}, config = {}) => api.post(`${API_URL.API_LIST}`, parm, config);
  const getPrint = (code, config = {}) => api.get(`${API_URL.API_DELIVERY_NOTE}?code=${code}`, config);
  const code = (config = {}) => api.get(`${API_URL.API_GETCODE}`, config);
  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, { cancle: true, ignoreLoading : true, ...config});
  const issue = (code, config = {}) => api.get(`${API_URL.API_ISSUE}?code=${code}`, config);
  const getdetail_for_issue = (parm = {}, config = {}) => api.post(`${API_URL.API_GETDETAIL}`, parm, config);
  

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