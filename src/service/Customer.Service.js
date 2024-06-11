import { requestService as api } from "./Request.service"  

const API_URL = {
  API_MANAGE: `/customer/manage.php`,
  API_SEARCH: `/customer/search.php`,
  API_GETCODE: `/customer/get_cuscode.php`,
};

const CustomerService = () => { 
 
  const create = (parm = {}) => api.post(`${API_URL.API_MANAGE}`, parm);
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm);
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`);
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`);
  const getcode = () => api.get(`${API_URL.API_GETCODE}`, { ignoreLoading : true });
  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});

  return {
    create,
    update,
    deleted,
    get,
    getcode,
    search,

  };
};

export default CustomerService;
