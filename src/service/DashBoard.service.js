import { requestService as api } from "./Request.service"  
const API_URL = { 
  API_SAMPLELIST: `/dashboard/get-sample-list.php`,  
  API_SAMPLEREQUEST_LIST: `/dashboard/get-sample-request-list.php`,  
  API_SAMPLEREQUEST_DETAIL: `/dashboard/get-sample-request-details.php`,  
  API_FILEEXPIRE: `/dashboard/get-items-files-expiry.php`,  
  API_STATISTICS: `/dashboard/get-statistic-value.php`,  
};
  
const DashBoardService = () => { 
  const resolveConfig = (configOrLoad = false) => (
    typeof configOrLoad === "boolean"
      ? { ignoreLoading: configOrLoad }
      : configOrLoad
  );
  
  const samplelist = (parm = {}, configOrLoad = false) => api.post(`${API_URL.API_SAMPLELIST}`, parm, resolveConfig(configOrLoad));
  const sample_requestlist = (parm = {}, configOrLoad = false) => api.post(`${API_URL.API_SAMPLEREQUEST_LIST}`, parm, resolveConfig(configOrLoad));
  const sample_requestdetail = (parm = {}, configOrLoad = false) => api.post(`${API_URL.API_SAMPLEREQUEST_DETAIL}`, parm, resolveConfig(configOrLoad));
  const filesexpire = (parm = {}, configOrLoad = false) => api.post(`${API_URL.API_FILEEXPIRE}`, parm, resolveConfig(configOrLoad));
  const statistics = (configOrLoad = false) => api.post(`${API_URL.API_STATISTICS}`, null, resolveConfig(configOrLoad));

  return {
    samplelist,
    sample_requestlist,
    sample_requestdetail,

    filesexpire,
    statistics,

  };
};

export default DashBoardService;