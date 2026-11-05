import React from 'react';
import { PermissionProvider } from '../../store/context/permission-context';
import PermissionGuard from '../../components/auth/PermissionGuard';
import PermissionAccess from './PermissionAccess';
export default function PermissionPage() {
  return <PermissionProvider><PermissionGuard menu="permission" action="view"><PermissionAccess /></PermissionGuard></PermissionProvider>;
}
