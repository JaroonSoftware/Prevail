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
  const create = (parm={}) => api.post(API_URL.API_MANAGE, parm); 
  const update = (parm={}) => api.put(API_URL.API_MANAGE, parm);
  const del = (code=null) => api.delete(API_URL.API_MANAGE+`?code=${code}`);
  const get = (code=null) => api.get(API_URL.API_MANAGE+`?code=${code}`);
  const spcode = () => api.get(API_URL.API_SPCODE);
  const search = ( parm={}, config={}) => api.post(API_URL.API_SEARCH, parm, {...config, cancel:true});
  const get_sptags = (code=null) => api.get(API_URL.API_TAGS+`?code=${code || ""}`, { ignoreLoading : true });
  
  const sptags_create = (parm={}) => api.post(API_URL.API_SPTAGS_MANAGE, parm, { ignoreLoading : true });
  const sptags_delete = (code=null) => api.delete(API_URL.API_SPTAGS_MANAGE+`?code=${code}`, { ignoreLoading : true });
  
  const approved = (parm={}) => api.put(API_URL.API_SPAPPROVE, parm);
  const cancel_approved = (parm={}) => api.put(API_URL.API_SPAPPROVE_CANCEL, parm);
  
  const cancel_sample_preparation = (parm={}) => api.put(API_URL.API_SPSTATUS, { ...parm, status: 'cancel' });
  const spduplicate = (parm={}) => api.post(API_URL.API_SPDUPLICATE, { ...parm } );
  // const waiting_approved = () => api.get(API_URL.API_APPROVES_RESULT + '?r=waiting_approve');
  const coa = (code) => api.get(`${API_URL.API_COA}?code=${code}`);
  const lot = (code) => api.get(`${API_URL.API_LOT}?code=${code}`);

  const customer_approved = (parm) => api.put(API_URL.API_CUSTOMER_APPROVED_STATUS, parm);

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