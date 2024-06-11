import axios from "../components/layout/AxiosInterceptor";
// import { BACKEND_URL } from "../utils/util";
// import {  message } from 'antd';
// import { Authenticate } from "./Authenticate.service"; 
// const [messageApi] = message.useMessage();
// const auThen = Authenticate();
export const requestService = axios;


export const getParmeter = (p)=> ( Object.keys(p).map( n => `${n}=${p[n]}`) ).join("&");

export default requestService;