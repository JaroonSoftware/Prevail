import { requestService as api } from "./Request.service"  

const API_URL = {
  API_MANAGE: `/catalog/manage.php`,
  API_SEARCH: `/catalog/search.php`,
  API_GETCODE: `/catalog/get-doc-code.php`, 
};



const CatalogService = () => { 
 
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);
  const getcode = (config = {}) => api.get(`${API_URL.API_GETCODE}`, { ignoreLoading : true, ...config });
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

export default CatalogService;
