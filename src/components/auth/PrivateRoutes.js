/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Modal } from 'antd';
import Main from "../layout/Main";
import { Authenticate } from "../../service/Authenticate.service";
import { store } from "../../store/store";
import { Provider } from "react-redux";
import { LoadingProvider } from "../../store/context/loading-context"
import { AxiosInterceptor } from "../layout/AxiosInterceptor";
import { LAYOUT } from "../../constant/constant";
// import { LoadingProvider } from "../../store/context/loading-context"

const authService = Authenticate();
const PrivateRoute = ({ allowdRole, layout = 'child' }) => {
  const location = useLocation();
  const navigate = useNavigate();
   
  // const [ tokenExp, setTokenExp ] = useState(true);
  const [ isAuth, setIsAuth ] = useState(true);
  // const navigate = useNavigate(); 
  //   useEffect(() => {
  //     let exp = STORAGE.GET("expired");
  //     let token = STORAGE.GET("token");
  //     let current = parseInt(Date.now() / 1000);

  //     if (!token || !exp || current > exp) {
  //       navigate("/login", { replace: true });
  //     }
  //   }, [location.pathname]);
  useEffect(() => {
    const ath = authCheck();
    setIsAuth( ath );
  }, [location.pathname]);

  // useEffect(() => {  
  //   const ath = authCheck();
  //   setIsAuth( ath );
  // }, []);

  const authCheck = () => {
    let payload = { role: "admin" };
    const exp = authService.isExpireToken( ()=>{ 
      authService.setCurrent(location.pathname);
      navigate("/login", { replace: true });
    }); 
    
    if( allowdRole.includes(payload?.role) && exp ) return true;
    else return Modal.error({
      title: 'Session Expire',
      content: 'your session expired please relogin',
      onOk: () => { 
        authService.setCurrent(location.pathname);
        navigate("/", { replace: true })
      }
    })
  };

  const Contents = () => {
    if( isAuth && LAYOUT.CHILD === layout ) {
      return (
        <Provider store={store}>
          {/* <LoadingProvider> */}
            <Main>
              <Outlet />
            </Main>
          {/* </LoadingProvider> */}
        </Provider>        
      )
    } else if (isAuth && LAYOUT.ALOND === layout) {
      return ( 
        <LoadingProvider>
          <AxiosInterceptor>
            <Outlet />
          </AxiosInterceptor>
        </LoadingProvider>
      )
    } else {
      return ( <Navigate to="/login" state={{ from: location }} replace /> )
    }
  }

  return <Contents /> 
};

export default PrivateRoute;
