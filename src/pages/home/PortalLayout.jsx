import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb, Button, Dropdown } from 'antd';
import { HomeOutlined, UserOutlined, SettingOutlined, LogoutOutlined, PushpinFilled } from '@ant-design/icons';
import { Authenticate } from '../../service/Authenticate.service';
import ModalResetPassword from '../../components/modal/reset-password/ModalResetPassword';
import logo from '../../assets/images/logo.png';
import { MODULES, moduleForPath, visibleMenus, readRecent, recordRecent } from './menu-data';
import { usePinnedMenus } from './pinned-menu';
import './menu.css';

export default function PortalLayout({ children }) {
  const auth = Authenticate();
  const user = auth.getUserInfo();
  const location = useLocation();
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);
  const userId = user?.userid || '';
  const pinned = usePinnedMenus(userId);
  const [recent, setRecent] = useState(() => readRecent(userId));
  const isMenu = location.pathname === '/menu' || location.pathname.startsWith('/menu/');
  const code = isMenu ? location.pathname.split('/')[2] : moduleForPath(location.pathname)?.code;
  const menus = visibleMenus((auth.getType() || '').toLowerCase(), user?.username || userId);
  const currentMenu = menus.find(m => location.pathname === m.to || location.pathname.startsWith(m.to + '/'));
  const currentPath = currentMenu?.to;
  const pinnedMenus = pinned.map(p => menus.find(m => m.to === p)).filter(Boolean);
  const onPinnedMenu = pinnedMenus.some(m => m.to === currentPath);

  useEffect(() => {
    setRecent(currentPath ? recordRecent(userId, currentPath) : readRecent(userId));
  }, [userId, currentPath]);

  const codes = [code, ...recent.map(p => moduleForPath(p)?.code)].filter(Boolean);
  const chips = [...new Set(codes)].map(c => MODULES.find(m => m.code === c))
    .filter(m => m && menus.some(n => m.paths.includes(n.to))).slice(0, 3);
  const module = MODULES.find(m => m.code === code);
  const actions = [
    { key: 'reset', label: 'เปลี่ยนรหัสผ่าน', icon: <SettingOutlined />, onClick: () => setReset(true) },
    { type: 'divider' },
    { key: 'logout', label: 'ออกจากระบบ', icon: <LogoutOutlined />, danger: true,
      onClick: () => { auth.removeToken(); navigate('/login', { replace: true }); } },
  ];
  const breadcrumbs = [
    { title: <Link to="/menu">เมนูระบบ</Link> },
    ...(module ? [{ title: <Link to={'/menu/' + code}>{module.title}</Link> }] : []),
    ...(currentMenu ? [{ title: <Link to={currentMenu.to}>{currentMenu.title}</Link> }] : []),
  ];

  return (
    <div className="pv-shell">
      <header className="pv-header">
        <Link to="/menu" className="pv-brand" aria-label="PREVAIL เมนูระบบ">
          <img src={logo} alt="Prevail" /><strong>PREVAIL</strong>
        </Link>
        <nav className="pv-topnav" aria-label="เมนูหลัก">
          <Link className={'pv-chip ' + (isMenu && !code ? 'active' : '')} to="/menu"
            aria-current={isMenu && !code ? 'page' : undefined}><HomeOutlined /> เมนูระบบ</Link>
          {onPinnedMenu && <span className="pv-pinned-label"><PushpinFilled /> เมนูปักหมุด</span>}
          {onPinnedMenu ? pinnedMenus.map(m => <Link key={m.to} className={'pv-chip ' + (currentPath === m.to ? 'active' : '')}
            to={m.to} aria-current={currentPath === m.to ? 'page' : undefined}>{m.title}</Link>) : chips.map(m => <Link key={m.code} className={'pv-chip ' + (code === m.code ? 'active' : '')}
            to={'/menu/' + m.code} aria-current={code === m.code ? 'page' : undefined}>
            {m.code} · {m.title}
          </Link>)}
        </nav>
        <Dropdown menu={{ items: actions }} trigger={['click']}>
          <Button type="text" className="pv-user" aria-label="บัญชีผู้ใช้">
            <UserOutlined /><span>{[user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.username}
              <small>{auth.getType()}</small></span>
          </Button>
        </Dropdown>
      </header>
      <main className={'pv-content' + (isMenu ? '' : ' pv-work-content content-ant')}>
        {!isMenu && <Breadcrumb className="pv-breadcrumb" items={breadcrumbs} />}
        {children}
      </main>
      <ModalResetPassword open={reset} onClose={() => setReset(false)} userid={userId} />
    </div>
  );
}
