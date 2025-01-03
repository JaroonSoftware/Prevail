import { requestService as api, getParmeter } from "./Request.service"  
const API_URL = {
  OPTION_ITEMS: `/common/options-items.php`, 
  OPTION_ITEMS_BYTYPE: `/common/options-items-bytype.php`, 
  OPTION_CART: `/common/options-cart.php`, 
  OPTION_SUPPLIER: `/common/options-supplier.php`,
  OPTION_CUSTOMER: `/common/options-customer.php`,
  OPTION_QUOTATION: `/common/options-quotation.php`,
  OPTION_INVOICE: `/common/options-invoice.php`,  
  OPTION_DELIVERY_NOTE: `/common/options-delivery-note.php`,  
  OPTION_ITEMSTYPE: `/common/options-itemstype.php`,
  OPTION_UNIT: `/common/options-unit.php`,
  OPTION_PurchaseOrder: `/common/options-purchaseorder.php`,
  OPTION_BANKS: `/common/options-banks.php`,
  OPTION_CATALOG: `/common/options-catalog.php`,
  OPTION_USER: `/common/options-user.php`,
  OPTION_County: `/common/options-county.php`,
  OPTION_SO: `/common/options-so.php`,
};
 

const OptionService = () => {
  const optionsItems = (parm = {}) => api.get(`${API_URL.OPTION_ITEMS}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsItemsbytype = (parm = {}, config = {}) => api.post(`${API_URL.OPTION_ITEMS_BYTYPE}`, parm, {...config, cancle: true});
  const optionsCart = (parm = {}) => api.post(`${API_URL.OPTION_CART}`, parm, { cancle: true, ignoreLoading : true});
  const optionsSupplier = () => api.get(`${API_URL.OPTION_SUPPLIER}`, { ignoreLoading : true });
  const optionsCustomer = () => api.get(`${API_URL.OPTION_CUSTOMER}`, { ignoreLoading : true });
  const optionsQuotation = () => api.get(`${API_URL.OPTION_QUOTATION}`, { ignoreLoading : true });
  const optionsInvoice = (parm = {}) => api.get(`${API_URL.OPTION_INVOICE}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsDeliverynote = (parm = {}) => api.get(`${API_URL.OPTION_DELIVERY_NOTE}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsItemstype = () => api.get(`${API_URL.OPTION_ITEMSTYPE}`, { ignoreLoading : true });
  const optionsUnit = () => api.get(`${API_URL.OPTION_UNIT}`, { ignoreLoading : true });  
  const optionsPurchaseOrder = () => api.get(`${API_URL.OPTION_PurchaseOrder}`, { ignoreLoading : true });
  const optionsBanks = (parm = {}) => api.get(`${API_URL.OPTION_BANKS}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsCatalog = () => api.get(`${API_URL.OPTION_CATALOG}`, { ignoreLoading : true });  
  const optionsUser = () => api.get(`${API_URL.OPTION_USER}`, { ignoreLoading : true });  
  const optionsCounty = () => api.get(`${API_URL.OPTION_County}`, { ignoreLoading : true });  
  const optionsSO = (parm = {}) => api.get(`${API_URL.OPTION_SO}?${getParmeter(parm)}`, { ignoreLoading : true });

  return {
    optionsItems,
    optionsItemsbytype,
    optionsCart,
    optionsSupplier,
    optionsCustomer,
    optionsQuotation,
    optionsInvoice,
    optionsDeliverynote,
    optionsItemstype,
    optionsUnit,
    optionsPurchaseOrder,
    optionsBanks,
    optionsCatalog,
    optionsUser,
    optionsCounty,
    optionsSO,
  };
};

export default OptionService;