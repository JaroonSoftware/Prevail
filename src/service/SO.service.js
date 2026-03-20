import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/so/manage.php`, 
  API_GETMASTER: `/so/search.php`, 
  API_GET_BYCUS: `/so/get-by-cus.php`,
  API_GETCODE: `/so/get-socode.php`, 
  API_LIST: `/so/list.php`, 
  API_PICKUP_LIST: `/so/pickuplist.php`,   
};
  
const SOService = () => { 
  
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);
  const getlist = (parm = {}, config = {}) => api.post(`${API_URL.API_LIST}`, parm, config);
  const getPickup = (code, config = {}) => api.get(`${API_URL.API_PICKUP_LIST}?code=${code}`, config);
  const getbycus = (code, config = {}) => api.get(`${API_URL.API_GET_BYCUS}?code=${code}`, config);

  const code = (config = {}) => api.get(`${API_URL.API_GETCODE}`, config);

  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_GETMASTER}`, parm, { cancle: true, ...config });
  

  return {
    create,
    update,
    deleted,
    get, 
    getlist,
    getPickup,
    getbycus,
    code,

    search,
  };
};

export default SOService;