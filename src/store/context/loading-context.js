import React, { createContext, useContext } from 'react';
import useLoading from '../hook/use-loading.hook';
import logoPrevail from '../../assets/images/logo.png';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const loading = useLoading();

  return (
    <LoadingContext.Provider value={loading}>
      {loading.loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <img src={logoPrevail} alt="Prevail" className="loading-logo" />
            <span className="loading-text">กำลังโหลด...</span>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};