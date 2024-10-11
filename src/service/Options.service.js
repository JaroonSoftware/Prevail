import { requestService as api, getParmeter } from "./Request.service"  
const API_URL = {
  OPTION_ITEMS: `/common/options-items.php`, 
  OPTION_ITEMS_BYTYPE: `/common/options-items-bytype.php`, 
  OPTION_CART: `/common/options-cart.php`, 
  OPTION_SUPPLIER: `/common/options-supplier.php`,
  OPTION_CUSTOMER: `/common/options-customer.php`,
  OPTION_QUOTATION: `/common/options-quotation.php`,
  OPTION_INVOICE: `/common/options-invoice.php`,  
  OPTION_ITEMSTYPE: `/common/options-itemstype.php`,
  OPTION_UNIT: `/common/options-unit.php`,
  OPTION_PurchaseOrder: `/common/options-purchaseorder.php`,
  OPTION_BANKS: `/common/options-banks.php`,
  OPTION_CATALOG: `/common/options-catalog.php`,
};
 

const OptionService = () => {
  const optionsItems = (parm = {}) => api.get(`${API_URL.OPTION_ITEMS}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsItemsbytype = (parm = {}, config = {}) => api.post(`${API_URL.OPTION_ITEMS_BYTYPE}`, parm, {...config, cancle: true});
  const optionsCart = (parm = {}) => api.post(`${API_URL.OPTION_CART}`, parm, { cancle: true, ignoreLoading : true});
  const optionsSupplier = () => api.get(`${API_URL.OPTION_SUPPLIER}`, { ignoreLoading : true });
  const optionsCustomer = () => api.get(`${API_URL.OPTION_CUSTOMER}`, { ignoreLoading : true });
  const optionsQuotation = () => api.get(`${API_URL.OPTION_QUOTATION}`, { ignoreLoading : true });
  const optionsInvoice = () => api.get(`${API_URL.OPTION_INVOICE}`, { ignoreLoading : true });
  const optionsItemstype = () => api.get(`${API_URL.OPTION_ITEMSTYPE}`, { ignoreLoading : true });
  const optionsUnit = () => api.get(`${API_URL.OPTION_UNIT}`, { ignoreLoading : true });  
  const optionsPurchaseOrder = () => api.get(`${API_URL.OPTION_PurchaseOrder}`, { ignoreLoading : true });
  const optionsBanks = (parm = {}) => api.get(`${API_URL.OPTION_BANKS}?${getParmeter(parm)}`, { ignoreLoading : true });
  const optionsCatalog = () => api.get(`${API_URL.OPTION_CATALOG}`, { ignoreLoading : true });  

  return {
    optionsItems,
    optionsItemsbytype,
    optionsCart,
    optionsSupplier,
    optionsCustomer,
    optionsQuotation,
    optionsInvoice,
    optionsItemstype,
    optionsUnit,
    optionsPurchaseOrder,
    optionsBanks,
    optionsCatalog,
  };
};

export default OptionService;