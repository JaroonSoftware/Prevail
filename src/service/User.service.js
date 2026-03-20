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

const withAuthConfig = (config = {}) => ({
  ...config,
  headers: {
    ...getHeader(),
    ...(config.headers || {}),
  },
});


const UserService = () => { 
 

  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, withAuthConfig(config));
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, withAuthConfig(config));
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, withAuthConfig(config));
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, withAuthConfig(config));
  const resetPassword = (parm = {}, config = {}) => api.put(`${API_URL.ResetPassword}`, parm, withAuthConfig(config));  
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
