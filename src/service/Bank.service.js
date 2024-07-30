import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/banks/manage.php`, 
  API_GETMASTER: `/banks/get-banks.php`, 
};

const BankService = () => { 
  
  const create = (parm = {}, conf = {}) => api.post(`${API_URL.API_MANAGE}`, parm, conf);
  const update = (parm = {}, conf = {}) => api.put(`${API_URL.API_MANAGE}`, parm, conf);
  const deleted = (code, conf = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, conf);
  const get = (code, conf = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, conf);


  const search = (parm = {}, conf = {}) => api.post(`${API_URL.API_GETMASTER}`, parm, conf);

  return {
    create,
    update,
    deleted,
    get,

    search,
  };
};

export default BankService;