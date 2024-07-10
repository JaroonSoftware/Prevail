import { requestService as api } from "./Request.service"  
import { STORE_KEY } from "../constant/constant";

const API_URL = {
  API_GETMASTER: `/user/get_user.php`, 
  API_MANAGE: `/user/manage.php`,
  ResetPassword: `/user/resetpassword.php`,
};

const getHeader = () => {
  const t = sessionStorage.getItem(STORE_KEY.authen);

  return {
    // "content-type" : "application/x-www-form-urlencoded",
    "Authorization" : `Bearer ${t}`
  }
}


const UserService = () => { 
 

  const create = (parm = {}) => api.post(`${API_URL.API_MANAGE}`, parm, { headers: getHeader() });
  const update = (parm = {}) => api.put(`${API_URL.API_MANAGE}`, parm, { headers: getHeader() });
  const deleted = (code) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, { headers: getHeader() });
  const get = (code) => api.get(`${API_URL.API_MANAGE}?code=${code}`, { headers: getHeader() });
  const resetPassword = (parm = {}) => api.put(`${API_URL.ResetPassword}`, parm, { headers: getHeader() });  
  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_GETMASTER}`, parm, {...config, cancle: true});

  return {
    create,
    update,
    deleted,
    get,
    resetPassword,
    search,

  };
};

export default UserService;
