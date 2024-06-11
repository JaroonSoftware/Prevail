/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../utils/util";
import { STORE_KEY } from "../../constant/constant";
// import { message } from 'antd';
import { useLoadingContext } from "../../store/context/loading-context";
// import { useNavigate } from 'react-router-dom';
// import { useLocation } from "react-router-dom";
const instance = axios.create({ baseURL: BACKEND_URL });

// const tokens = sessionStorage.getItem(STORE_KEY.authen);
const AxiosInterceptor = ({ children }) => {
    const { startLoading, stopLoading } = useLoadingContext(); 
    // const navigate = useNavigate();
    // const { pathname } = useLocation();

    // const [token, setToken ] = useState("");
    const [isSet, setIsSet] = useState(false);
    useEffect(() => { 
        
        // setToken( () => sessionStorage.getItem(STORE_KEY.authen) );
        const interceptorReq = instance.interceptors.request.use(
            (config) => {
                // const t = token;
                const t = sessionStorage.getItem(STORE_KEY.authen);
                // console.log(t, "asdas");
                if( !config?.ignoreLoading ) startLoading();
                // const token = auThen.getToken();
                if (t) {
                    config.headers.Authorization = `Bearer ${t}`;
                    // config.headers['Content-Type'] = "application/x-www-form-urlencoded";
                }
                if( !!config?.cancel ) {
                    const cancelTokenSource = axios.CancelToken.source();
                    config.cancelToken = cancelTokenSource?.token;
                }
                return config;
            },
            (error) => {
                stopLoading();  
                return Promise.reject(error); 
            }
        );  

        const interceptorRes = instance.interceptors.response.use(
            (response) => {
                stopLoading();
                // console.log("resInterceptor");
                return response;
            },
            (error) => {
                stopLoading(); 
                // console.log("errInterceptor");
                const originalRequest = error.config;
                
                // If the error status is 401 and there is no originalRequest._retry flag,
                // it means the token has expired and we need to refresh it
                if (error.response?.status === 401 && !originalRequest?._retry) {
                    originalRequest._retry = true;
                    delete axios.defaults.headers.common["Authorization"];
                    throw new Error(error);
                    // message.error(error.response?.message || "Token epired");
                }

                return Promise.reject(error);
            }
        ); 
    
        // console.log("useEffect - request", {isSet, token });
        // setToken(sessionStorage.getItem(STORE_KEY.authen));

        setIsSet(true);
        return () => {
            instance.interceptors.request.eject(interceptorReq);
            instance.interceptors.response.eject(interceptorRes); 
        }  

  }, []);

  return isSet && children;
};

export default instance;
export { AxiosInterceptor };
