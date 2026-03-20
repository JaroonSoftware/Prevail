import { requestService as api } from "./Request.service"  

const API_URL = {
  API_MANAGE: `/items/manage.php`,
  API_SEARCH: `/items/search.php`,
  Upload_Pic: `/items/upload_pic.php`,
  Delete_Pic: `/items/delete_pic.php`,
  Delete_Pic_Update: `items/delete_pic_update.php`,
  API_ORDER: `/items/order.php`
};



const ItemsService = () => { 
 
  const create = (parm = {}, config = {}) => api.post(`${API_URL.API_MANAGE}`, parm, config);
  const update = (parm = {}, config = {}) => api.put(`${API_URL.API_MANAGE}`, parm, config);
  const deleted = (code, config = {}) => api.delete(`${API_URL.API_MANAGE}?code=${code}`, config);
  const get = (code, config = {}) => api.get(`${API_URL.API_MANAGE}?code=${code}`, { ignoreLoading : true, ...config });
  const search = (parm = {}, config = {}) => api.post(`${API_URL.API_SEARCH}`, parm, {...config, cancle: true});
  const uploadPic = (parm = {}) =>  api.post(`${API_URL.Upload_Pic}`, parm);
  const deletePic = (parm = {}) =>  api.post(`${API_URL.Delete_Pic}`, parm);
  const deletePicUpdate = (parm = {}) =>  api.post(`${API_URL.Delete_Pic_Update}`, parm);
  const order = (parm = {}, config = {}) => api.put(`${API_URL.API_ORDER}`, parm, config);
  
  return {
    create,
    update,
    deleted,
    get,
    search,
    uploadPic,
    deletePic,
    deletePicUpdate,
    order
  };
};

export default ItemsService;
