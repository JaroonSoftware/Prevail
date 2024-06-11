import React, { createContext, useContext } from 'react';
import useLoading from '../hook/use-loading.hook';
import { Spin } from "antd";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const loading = useLoading();

  return (
    <LoadingContext.Provider value={loading}>
      {loading.loading && <div 
        style={{
          position: 'absolute',
          backgroundColor: 'rgb(250 250 250 / 90%)',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90000,
        }} 
      >
        <Spin spinning={loading.loading} />
      </div>}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};