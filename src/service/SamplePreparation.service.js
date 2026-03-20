import { requestService as api } from "./Request.service";
import { STORE_KEY } from "../constant/constant";
const API_URL = { 
    API_MANAGE: `/sp/manage.php`,
    API_SPTAGS_MANAGE: `/sp/manage-sptags.php`,

    API_SPCODE: `/sp/get-spcode.php`,
    API_SEARCH: `/sp/get-spmaster.php`,
    API_TAGS: `/sp/get-sptags.php`,
    API_APPROVES_RESULT: `/sp/get-count-approved-result.php`,
    
    API_SPAPPROVE: `/sp/set-approved.php`,
    API_SPAPPROVE_CANCEL: `/sp/set-cancel-approved.php`,
    API_SPSTATUS: `/sp/set-spstatus.php`,
    API_SPDUPLICATE: `/sp/set-spduplicate.php`,
    API_COA: `/sp/get-data-coa.php`,
    API_LOT: `/sp/get-data-loi.php`,

    API_CUSTOMER_APPROVED_STATUS: `/sp/set-approved-customer.php`,
};

const getHeader = () => {
  const t = sessionStorage.getItem(STORE_KEY.authen);

  return {
    "content-type" : "application/x-www-form-urlencoded",
    "Authorization" : `Bearer ${t}`
  }
} 


const SamplePreparationService = () => { 
  const create = (parm={}, config={}) => api.post(API_URL.API_MANAGE, parm, config); 
  const update = (parm={}, config={}) => api.put(API_URL.API_MANAGE, parm, config);
  const del = (code=null, config={}) => api.delete(API_URL.API_MANAGE+`?code=${code}`, config);
  const get = (code=null, config={}) => api.get(API_URL.API_MANAGE+`?code=${code}`, config);
  const spcode = (config={}) => api.get(API_URL.API_SPCODE, config);
  const search = ( parm={}, config={}) => api.post(API_URL.API_SEARCH, parm, {...config, cancel:true});
  const get_sptags = (code=null, config={}) => api.get(API_URL.API_TAGS+`?code=${code || ""}`, { ignoreLoading : true, ...config });
  
  const sptags_create = (parm={}, config={}) => api.post(API_URL.API_SPTAGS_MANAGE, parm, { ignoreLoading : true, ...config });
  const sptags_delete = (code=null, config={}) => api.delete(API_URL.API_SPTAGS_MANAGE+`?code=${code}`, { ignoreLoading : true, ...config });
  
  const approved = (parm={}, config={}) => api.put(API_URL.API_SPAPPROVE, parm, config);
  const cancel_approved = (parm={}, config={}) => api.put(API_URL.API_SPAPPROVE_CANCEL, parm, config);
  
  const cancel_sample_preparation = (parm={}, config={}) => api.put(API_URL.API_SPSTATUS, { ...parm, status: 'cancel' }, config);
  const spduplicate = (parm={}, config={}) => api.post(API_URL.API_SPDUPLICATE, { ...parm }, config );
  // const waiting_approved = () => api.get(API_URL.API_APPROVES_RESULT + '?r=waiting_approve');
  const coa = (code, config={}) => api.get(`${API_URL.API_COA}?code=${code}`, config);
  const lot = (code, config={}) => api.get(`${API_URL.API_LOT}?code=${code}`, config);

  const customer_approved = (parm, config={}) => api.put(API_URL.API_CUSTOMER_APPROVED_STATUS, parm, config);

  const waiting_approved = () => api({
    method: 'GET',      
    url: API_URL.API_APPROVES_RESULT + '?r=waiting_approve', 
    headers: getHeader(),
  });

  return {
    create,
    update,
    del,
    get,
    spcode,
    search,
    get_sptags,

    sptags_create,
    sptags_delete,
    approved,
    cancel_approved,

    cancel_sample_preparation,
    spduplicate,
    waiting_approved,

    coa,
    lot,

    customer_approved,
  };
};

export default SamplePreparationService;