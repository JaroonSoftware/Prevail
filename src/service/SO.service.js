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
  
  const create = (parm = {}) => api.post(`${API_URL.API_MANAGE}`, parm);
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm);
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`);
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`);
  const getlist = (parm = {}) => api.post(`${API_URL.API_LIST}`, parm);
  const getPickup = (code) => api.get(`${API_URL.API_PICKUP_LIST}?code=${code}`);
  const getbycus = (code) => api.get(`${API_URL.API_GET_BYCUS}?code=${code}`);

  const code = () => api.get(`${API_URL.API_GETCODE}`);

  const search = (parm = {}) => api.post(`${API_URL.API_GETMASTER}`, parm);
  

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