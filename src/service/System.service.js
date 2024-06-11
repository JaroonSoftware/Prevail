import axios from "axios";
import { MEDTHOD } from "../constant/constant";
import { BACKEND_URL } from "../utils/util";

const API_URL = {
  SIGN_IN: `${BACKEND_URL}/login/login_result.php`,
  GET_UNIT: `${BACKEND_URL}/unit/get_unit.php`,
};

const SystemService = {
  signIn: (reqData) => {
    return axios({
      method: MEDTHOD.POST,
      url: API_URL.SIGN_IN,
      data: reqData,
    });
  },

  getUnit: () => {
    return axios({
      medthod: MEDTHOD.GET,
      url: API_URL.GET_UNIT,
    });
  },
};

export default SystemService;
