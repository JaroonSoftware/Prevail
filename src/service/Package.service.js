import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/package/manage.php`, 
  API_SEARCH: `/package/search.php`, 

  API_PRINT: `/package/print-pk.php`, 
};
  
const PackageService = () => { 
  
  const printpackage = (parm = {}) => api.post(`${API_URL.API_PRINT}`, parm);
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm);
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`);
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`);

  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});
  

  return {
    printpackage,
    update,
    deleted,
    get, 

    search,
  };
};

export default PackageService;