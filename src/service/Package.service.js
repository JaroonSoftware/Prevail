import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_MANAGE: `/package/manage.php`, 
  API_SEARCH: `/package/search.php`, 

  API_PRINT: `/package/print-pk.php`, 
  API_CLEAR: `/package/clear-pk.php`,
};
  
const PackageService = () => { 
  
  const printpackage = (parm = {}, config = {}) => api.post(`${API_URL.API_PRINT}`, parm, config);
  /* ล้าง barcode หน้าถุงที่สร้างแล้ว เพื่อปริ้นใหม่ */
  const clearpackage = (parm = {}, config = {}) => api.post(`${API_URL.API_CLEAR}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, config);

  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});
  

  return {
    printpackage,
    clearpackage,
    update,
    deleted,
    get, 

    search,
  };
};

export default PackageService;