import jwt_decode from "jwt-decode";
import {decode as dcode, encode as ecode} from 'base-64'; 
import { STORE_KEY } from "../constant/constant";
export  const Authenticate = () => {
    
    const setToken = (token) =>{
       sessionStorage.setItem(STORE_KEY.authen, token);
    }
    
    const getToken = () =>{
        const t = sessionStorage.getItem(STORE_KEY.authen);
        // console.log(t);
        return t;
    }
    
    const removeToken = () =>{
        window.history.replaceState(null, null, "/");
        return sessionStorage.removeItem(STORE_KEY.authen);
    }
    
    const decodeToken = (token) => {
        // console.log(token, "asdasd");
        if(!token) return "";
        let d = jwt_decode(token || "");
        return d;
    }
    
    const isExpireToken = ( dirc = ()=>{} ) =>{
        // debugger;
        const t = getToken();
        // console.log(t, "SADfsdfsd");
        if(!t) {
            removeToken();
            window.history.replaceState(null, null, "/");
            dirc(); 
            return false;
        } else {
            const {expd:newdate} = decodeToken(t); 
            return (new Date(newdate.date)).getTime() > Date.now();
        }
    }
    
    const setCurrent = (path) =>{
        localStorage.setItem( STORE_KEY.current, ecode(ecode(path)) );
    }

    const getCurrent = () =>{
        let path = localStorage.getItem( STORE_KEY.current);

        return !!path ? dcode(dcode(path)) : path;
    }

    const getType = () =>{
        const t = sessionStorage.getItem( STORE_KEY.authen);
        if(!t) return null;
        const { type } = decodeToken(t);
        return type;
    }

    const getUserId = () =>{
        const t = sessionStorage.getItem( STORE_KEY.authen);
        if(!t) return null;
        const { userid } = decodeToken(t); 
        return userid;
    }

    const getUserInfo = () =>{
        const t = sessionStorage.getItem( STORE_KEY.authen);
        if(!t) return null;
        const { userid, firstname, lastname } = decodeToken(t); 
        return { userid, firstname, lastname };
    }

    const token = getToken();

    return {
        token,
        setToken,
        getToken,
        removeToken,
        decodeToken,
        isExpireToken,
        setCurrent,
        getCurrent,
        getType,
        getUserId,
        getUserInfo,
    };
}