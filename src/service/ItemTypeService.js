import axios from "axios";
import { MEDTHOD } from "../constant/constant";
import { BACKEND_URL } from "../utils/util";

const API_URL = {
  GET_ALL_ITEMTYPE: `${BACKEND_URL}/itemtype/get_allitemtype.php`,
  Add_ITEMTYPE: `${BACKEND_URL}/itemtype/add_itemtype.php`,
  GET_ITEMTYPE: `${BACKEND_URL}/itemtype/get_itemtype.php`,
  GETSUP_ITEMTYPE: `${BACKEND_URL}/itemtype/getsup_itemtype.php`,
  Edit_ITEMTYPE: `${BACKEND_URL}/itemtype/edit_itemtype.php`,
};

let contenttype = {"content-type": "application/x-www-form-urlencoded"};

const ItemTypeService = {
  getAllItemsType: () => {
    return axios({
      medthod: MEDTHOD.GET,
      url: API_URL.GET_ALL_ITEMTYPE,
      headers: contenttype,
    });
  },

  addItemType: (reqData) => {
    return axios({
      method: MEDTHOD.POST,
      url: API_URL.Add_ITEMTYPE,
      headers: contenttype,
      data: reqData,
    });
  },

  getItemType: () => {
    return axios({
      medthod: MEDTHOD.GET,
      url: API_URL.GET_ITEMTYPE,
      headers: contenttype,
    });
  },
  
  getSupItemType: (reqData) => {
    return axios({
      method: MEDTHOD.POST,      
      url: API_URL.GETSUP_ITEMTYPE,
      data: {
        idcode: reqData,
      },
      headers: contenttype,
    });
  },

  editItemType: (reqData) => {
    return axios({
      method: MEDTHOD.POST,
      url: API_URL.Edit_ITEMTYPE,
      headers: contenttype,
      data: reqData,
    });
  },
};

export default ItemTypeService;
