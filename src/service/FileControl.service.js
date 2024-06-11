import { requestService as api } from "./Request.service"  
const API_URL = {
  FILES_UPLOAD: `/files-control/uploads.php`,
  FILES_DOWNLOAD: `/files-control/download.php`,
  FILES_GETDATA: `/files-control/get.php`, 
  FILES_GET_FILELIST: `/files-control/get-filelist.php`, 
  UPLOAD_TYPE_OPTION: `/common/options-files.php`, 
  FILES_DELETE: `/files-control/del-file.php`, 
};
 

const FileService = () => {
  const fileUpload = (formData) => api.post(API_URL.FILES_UPLOAD, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const fileGetData = (parm) => api.post(API_URL.FILES_GETDATA, parm, { ignoreLoading : true } );
  const fileGetList = (id) => api.get(`${API_URL.FILES_GET_FILELIST}?id=${id}`, { ignoreLoading : true });

  const fileDelete = (id) => api.delete(`${API_URL.FILES_DELETE}?id=${id}`, { ignoreLoading : true });

  const fileDownload = (id) => api({
    method: 'get',
    url: `${API_URL.FILES_DOWNLOAD}?id=${id}`,
    responseType: 'blob', // Set responseType to 'blob' to handle binary data (like files)
  }).then(response => {  
    const blob = new Blob([response.data], { type: response.headers['content-type'] }); 
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.target = "_bank";
    // Extract filename from Content-Disposition header if available
    // const contentDisposition = response.headers['content-disposition'];
    // if (contentDisposition) {
    //   const matches = contentDisposition.match(/filename="(.+)"/);
    //   if (matches) {
    //     link.download = matches[1];
    //   }
    // }
    
    // If Content-Disposition header is not available, use a generic filename
    // if (!link.download) {
    //   link.download = 'downloaded-file';
    // }
    
    // Append the link to the document and trigger a click event
    document.body.appendChild(link);
    link.click();
     
    document.body.removeChild(link);
  });

  const uploadTypeOption = () => api.get(`${API_URL.UPLOAD_TYPE_OPTION}?p=title`, { ignoreLoading : true });

  return {
    fileUpload,
    fileDownload,
    fileGetData,
    fileGetList,
    uploadTypeOption,

    fileDelete,
  };
};

export default FileService;