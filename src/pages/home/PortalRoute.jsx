import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../store/store';
import { Authenticate } from '../../service/Authenticate.service';


import Main from '../../components/layout/Main';
export default function PortalRoute() {
 let valid=false;
 try {const auth=Authenticate();const token=auth.getToken();const payload=token?auth.decodeToken(token):null;valid=!!payload?.exp&&payload.exp*1000>Date.now();}catch{}
 if(!valid)return <Navigate to="/login" replace/>;
 return <Provider store={store}><Main><Outlet/></Main></Provider>;
}
