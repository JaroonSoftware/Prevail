import React from 'react';
import { Alert, Button, Result, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermission } from '../../store/context/permission-context';
import { menuForPath, actionForPath } from '../../constant/permission';
export default function PermissionGuard({ children, menu, action }) {
  const location = useLocation(); const navigate = useNavigate();
  const { loading, error, can, reload } = usePermission();
  if (loading) return <Spin tip="กำลังตรวจสอบสิทธิ์"><div style={{ minHeight: 160 }} /></Spin>;
  if (error) return <Alert type="error" showIcon message={error} action={<Button onClick={reload}>ลองใหม่</Button>} />;
  const key = menu || menuForPath(location.pathname);
  if (!key || !can(key, action || actionForPath(location.pathname))) return <Result status="403" title="ไม่มีสิทธิ์เข้าใช้งาน" extra={<Button onClick={() => navigate('/dashboard')}>กลับหน้าหลัก</Button>} />;
  return children;
}
