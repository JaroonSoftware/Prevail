import { requestService as api, getParmeter } from "./Request.service"  
const API_URL = {
  OPTION_ITEMS: `/common/options-items.php`, 
  OPTION_SUPPLIER: `/common/options-supplier.php`,
  OPTION_CUSTOMER: `/common/options-customer.php`,
  OPTION_QUOTATION: `/common/options-quotation.php`,
  OPTION_ITEMSTYPE: `/common/options-itemstype.php`,
  OPTION_UNIT: `/common/options-unit.php`,
};
 

const OptionService = () => {
  const optionsItems = (parm = {}) => api.get(`${API_URL.OPTION_ITEMS}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsSupplier = () => api.get(`${API_URL.OPTION_SUPPLIER}`, { ignoreLoading : true });
  const optionsCustomer = () => api.get(`${API_URL.OPTION_CUSTOMER}`, { ignoreLoading : true });
  const optionsQuotation = () => api.get(`${API_URL.OPTION_QUOTATION}`, { ignoreLoading : true });
  const optionsItemstype = () => api.get(`${API_URL.OPTION_ITEMSTYPE}`, { ignoreLoading : true });
  const optionsUnit = () => api.get(`${API_URL.OPTION_UNIT}`, { ignoreLoading : true });

  return {
    optionsItems,
    optionsSupplier,
    optionsCustomer,
    optionsQuotation,
    optionsItemstype,
    optionsUnit,
  };
};

export default OptionService;