import { requestService as api } from "./Request.service";
import { STORE_KEY } from "../constant/constant";

/* PermissionProvider ถูก mount นอก AxiosInterceptor จึงแนบ token เองกันพลาด
   ถ้าเรียกก่อน interceptor ติดตั้ง จะไม่มี Authorization → 401 → สิทธิ์ว่างทั้งระบบ */
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem(STORE_KEY.authen) || ""}` });

const API_URL = {
  ME: `/permission/me.php`,
  LIST: `/permission/get-permission.php`,
  MANAGE: `/permission/manage.php`,
  ROLE_USERS: `/permission/role-users.php`,
};

const PermissionService = () => {
  const me = (config = {}) => api.get(API_URL.ME, { ignoreLoading: true, headers: authHeader(), ...config });
  const list = (config = {}) => api.get(API_URL.LIST, { headers: authHeader(), ...config });

  const saveMatrix = (matrix) => api.put(API_URL.MANAGE, { matrix }, { headers: authHeader() });
  const createRole = (header) => api.post(API_URL.MANAGE, { header }, { headers: authHeader() });
  const updateRole = (header) => api.patch(API_URL.MANAGE, { header }, { headers: authHeader() });
  const deleteRole = (code) => api.delete(`${API_URL.MANAGE}?code=${encodeURIComponent(code)}`, { headers: authHeader() });
  const roleUsers = (code) => api.get(`${API_URL.ROLE_USERS}?code=${encodeURIComponent(code)}`, { headers: authHeader() });

  return { me, list, saveMatrix, createRole, updateRole, deleteRole, roleUsers };
};

export default PermissionService;
