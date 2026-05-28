/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Modal } from 'antd';
import Main from "../layout/Main";
import { Authenticate } from "../../service/Authenticate.service";
import { store } from "../../store/store";
import { Provider } from "react-redux";
import { LoadingProvider } from "../../store/context/loading-context"
import { AxiosInterceptor } from "../layout/AxiosInterceptor";
// import { LoadingProvider } from "../../store/context/loading-context"

const authService = Authenticate();
const PrivateRoute = ({ allowdRole, mode = "manage" }) => {
  const location = useLocation();
  const navigate = useNavigate();
   
  const isModalShown = useRef(false);
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
    const exp = authService.isExpireToken( ()=>{
      authService.setCurrent(location.pathname);
      navigate("/login", { replace: true });
    });

    // Token expired or missing → show session expire modal
    if (!exp) {
      if (!isModalShown.current) {
        isModalShown.current = true;
        Modal.error({
          title: 'Session Expire',
          content: 'your session expired please relogin',
          onOk: () => {
            isModalShown.current = false;
            authService.removeToken();
            navigate("/login", { replace: true });
          }
        });
      }
      return true;
    }

    const userType = authService.getType() || "user";

    // Valid session but wrong role → redirect to dashboard silently
    // if (!allowdRole.includes(userType)) {
    //   navigate("/dashboard", { replace: true });
    //   return true;
    // }

    return true;
  };

  if (isAuth && mode === "manage") {
    return (
      <Provider store={store}>
        <Main>
          <Outlet />
        </Main>
      </Provider>
    );
  } else if (isAuth && mode === "print") {
    return (
      <LoadingProvider>
        <AxiosInterceptor>
          <div style={{ height: '100vh', overflow: 'auto' }}>
            <Outlet />
          </div>
        </AxiosInterceptor>
      </LoadingProvider>
    );
  } else {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default PrivateRoute;
