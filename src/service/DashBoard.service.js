import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_SAMPLELIST: `/dashboard/get-sample-list.php`,  
  API_SAMPLEREQUEST_LIST: `/dashboard/get-sample-request-list.php`,  
  API_SAMPLEREQUEST_DETAIL: `/dashboard/get-sample-request-details.php`,  
  API_FILEEXPIRE: `/dashboard/get-items-files-expiry.php`,  
  API_STATISTICS: `/dashboard/get-statistic-value.php`,  
};
  
const DashBoardService = () => { 
  
  const samplelist = (parm = {}, load = false) => api.post(`${API_URL.API_SAMPLELIST}`, parm, { ignoreLoading : load });
  const sample_requestlist = (parm = {}, load = false) => api.post(`${API_URL.API_SAMPLEREQUEST_LIST}`, parm, { ignoreLoading : load });
  const sample_requestdetail = (parm = {}, load = false) => api.post(`${API_URL.API_SAMPLEREQUEST_DETAIL}`, parm, { ignoreLoading : load });
  const filesexpire = (parm = {}, load = false) => api.post(`${API_URL.API_FILEEXPIRE}`, parm, { ignoreLoading : load });
  const statistics = (load = false) => api.post(`${API_URL.API_STATISTICS}`, null, { ignoreLoading : load });

  return {
    samplelist,
    sample_requestlist,
    sample_requestdetail,

    filesexpire,
    statistics,

  };
};

export default DashBoardService;