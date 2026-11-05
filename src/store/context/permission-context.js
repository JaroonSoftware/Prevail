import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import PermissionService from "../../service/Permission.service";
const service = PermissionService();
const Context = createContext({ loading: true, error: null, can: () => false, canView: () => false, reload: () => {} });
export function PermissionProvider({ children }) {
  const [state, setState] = useState({ loading: true, permission: {}, isAdmin: false });
  const request = useRef(0);
  const reload = useCallback(async () => {
    const id = ++request.current;
    setState({ loading: true, permission: {}, isAdmin: false });
    try {
      const response = await service.me();
      if (id !== request.current) return;
      const data = response?.data?.data || {};
      setState({ loading: false, error: null, isAdmin: !!data.is_admin, role: data.role, roleName: data.role_name, permission: data.permission || {} });
    } catch (error) {
      if (id === request.current) setState({ loading: false, permission: {}, isAdmin: false, error: error?.response?.data?.message || 'ตรวจสอบสิทธิ์ไม่สำเร็จ' });
    }
  }, []);
  const invalidate = useCallback(() => { request.current++; }, []);
  useEffect(() => { reload(); return invalidate; }, [reload, invalidate]);
  const can = (key, action = 'view') => !state.loading && !state.error && !!state.permission?.[key]?.[action];
  return <Context.Provider value={{ ...state, can, canView: (key) => can(key), reload }}>{children}</Context.Provider>;
}
export const usePermission = () => useContext(Context);
