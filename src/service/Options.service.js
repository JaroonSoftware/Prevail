import { requestService as api, getParmeter } from "./Request.service"  
const API_URL = {
  OPTION_ITEMS: `/common/options-items.php`, 
  OPTION_ITEMS_BYTYPE: `/common/options-items-bytype.php`, 
  OPTION_CART: `/common/options-cart.php`, 
  OPTION_SUPPLIER: `/common/options-supplier.php`,
  OPTION_CUSTOMER: `/common/options-customer.php`,
  OPTION_QUOTATION: `/common/options-quotation.php`,
  OPTION_INVOICE: `/common/options-invoice.php`,  
  OPTION_BILLING: `/common/options-billing.php`,  
  OPTION_DELIVERY_NOTE: `/common/options-delivery-note.php`, 
  OPTION_SHIPPING: `/common/options-shiping.php`, 
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
  const optionsItems = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_ITEMS}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });
  const optionsItemsbyCatalog = (parm = {}, config = {}) => api.post(`${API_URL.OPTION_ITEMS_BYCATALOG}`, parm, { cancle: true, ignoreLoading : true, ...config});
  const optionsItemsbytype = (parm = {}, config = {}) => api.post(`${API_URL.OPTION_ITEMS_BYTYPE}`, parm, { cancle: true, ...config});
  const optionsCart = (parm = {}, config = {}) => api.post(`${API_URL.OPTION_CART}`, parm, { cancle: true, ignoreLoading : true, ...config});
  const optionsSupplier = (config = {}) => api.get(`${API_URL.OPTION_SUPPLIER}`, { ignoreLoading : true, ...config });
  const optionsCustomer = (config = {}) => api.get(`${API_URL.OPTION_CUSTOMER}`, { ignoreLoading : true, ...config });
  const optionsQuotation = (config = {}) => api.get(`${API_URL.OPTION_QUOTATION}`, { ignoreLoading : true, ...config });
  const optionsInvoice = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_INVOICE}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });
  const optionsBilling = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_BILLING}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });
  const optionsDeliverynote = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_DELIVERY_NOTE}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });
  const optionsShipping = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_SHIPPING}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });
  const optionsItemstype = (config = {}) => api.get(`${API_URL.OPTION_ITEMSTYPE}`, { ignoreLoading : true, ...config });
  const optionsUnit = (config = {}) => api.get(`${API_URL.OPTION_UNIT}`, { ignoreLoading : true, ...config });  
  const optionsPurchaseOrder = (config = {}) => api.get(`${API_URL.OPTION_PurchaseOrder}`, { ignoreLoading : true, ...config });
  const optionsBanks = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_BANKS}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });
  const optionsCatalog = (config = {}) => api.get(`${API_URL.OPTION_CATALOG}`, { ignoreLoading : true, ...config });  
  const optionsUser = (config = {}) => api.get(`${API_URL.OPTION_USER}`, { ignoreLoading : true, ...config });  
  const optionsCounty = (config = {}) => api.get(`${API_URL.OPTION_County}`, { ignoreLoading : true, ...config });  
  const optionsSO = (parm = {}, config = {}) => api.get(`${API_URL.OPTION_SO}?${getParmeter(parm)}`, { ignoreLoading : true, ...config });

  return {
    optionsItems,
    optionsItemsbyCatalog,
    optionsItemsbytype,
    optionsCart,
    optionsSupplier,
    optionsCustomer,
    optionsQuotation,
    optionsInvoice,
    optionsBilling,
    optionsDeliverynote,
    optionsShipping,
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