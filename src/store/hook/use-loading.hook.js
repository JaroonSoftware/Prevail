import { useState } from 'react';

const useLoading = () => {
  const [loading, setLoading] = useState(false);
  const [ingore, setIgnore] = useState(false);

  const startLoading = () => {
    setLoading(true && !ingore);
  };

  const stopLoading = () => {
    return new Promise( r => {
      setTimeout( ()=> {
        setLoading(false && !ingore);

        r( loading );
      }, 400)
    });
  };

  const ignoreLoading = (bol) => {
    setIgnore(bol);
  };
 
  return {
    loading,
    startLoading,
    stopLoading,
    ignoreLoading,
  };
};

export default useLoading;