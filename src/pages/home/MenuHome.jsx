import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Empty, Result, Tooltip, message } from 'antd';
import { LuTruck } from 'react-icons/lu';
import { FileTextOutlined, ShoppingCartOutlined, AppstoreOutlined, WalletOutlined, SettingOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import { Authenticate } from '../../service/Authenticate.service';
import { MODULES, moduleForPath, visibleMenus, readRecent, recordRecent, moduleMenuSections } from './menu-data';
import { PINNED_MAX, togglePinned, usePinnedMenus } from './pinned-menu';

const icons = { SO: FileTextOutlined, PU: ShoppingCartOutlined, IC: AppstoreOutlined, AC: WalletOutlined, SH: LuTruck, AD: SettingOutlined };

export default function MenuHome() {
  const { moduleCode } = useParams();
  const auth = Authenticate(), user = auth.getUserInfo(), userId = user?.userid || '';
  const pinned = usePinnedMenus(userId);
  const menus = visibleMenus((auth.getType() || '').toLowerCase(), user?.username || userId);
  const modules = MODULES.filter(m => menus.some(menu => m.paths.includes(menu.to)));
  const selected = moduleCode ? modules.find(m => m.code === moduleCode) : null;
  const sections = moduleMenuSections(selected, menus);
  const pinnedMenus = pinned.map(p => menus.find(m => m.to === p)).filter(Boolean);
  const recent = readRecent(userId).filter(p => !pinned.includes(p)).map(p => menus.find(m => m.to === p)).filter(Boolean);

  const handlePin = menu => {
    const result = togglePinned(userId, menu.to);
    if (result.full) return message.warning('ปักหมุดได้สูงสุด ' + PINNED_MAX + ' เมนู');
    if (result.error) return message.error('บันทึกเมนูปักหมุดไม่ได้ กรุณาตรวจสอบการตั้งค่าพื้นที่จัดเก็บของเบราว์เซอร์');
    message.success(result.pinned ? 'ปักหมุด "' + menu.title + '" แล้ว' : 'ถอนหมุด "' + menu.title + '" แล้ว');
  };

  const tile = menu => {
    const mod = moduleForPath(menu.to), isPinned = pinned.includes(menu.to);
    return <div className="pv-tile-wrap" key={menu.to}>
      <Link className="pv-tile pv-menu-tile" to={menu.to} onClick={() => recordRecent(userId, menu.to)}>
        <span className="pv-tile-icon">{menu.icon || <AppstoreOutlined />}</span>
        <span className="pv-tile-title">{menu.title}</span>
        <span className="pv-tile-sub">{mod?.code} · {mod?.title}</span>
      </Link>
      {menu.to !== '/dashboard' && <Tooltip title={isPinned ? 'ถอนหมุดเมนู' : 'ปักหมุดเมนู'}>
        <button type="button" className={'pv-pin ' + (isPinned ? 'is-pinned' : '')}
          aria-label={(isPinned ? 'ถอนหมุด ' : 'ปักหมุด ') + menu.title} aria-pressed={isPinned}
          onClick={() => handlePin(menu)}>{isPinned ? <PushpinFilled /> : <PushpinOutlined />}</button>
      </Tooltip>}
    </div>;
  };

  const sectionPanel = (key, title, subtitle) => (
    <section className={'pv-module-panel pv-panel-' + key} aria-labelledby={'pv-section-' + key}>
      <div className="pv-panel-heading"><h3 id={'pv-section-' + key}>{title}</h3><span>{subtitle}</span></div>
      {sections[key].length > 0 ? <div className="pv-section-grid">{sections[key].map(tile)}</div>
        : <p className="pv-panel-empty">ไม่มีเมนูที่แสดงได้ในส่วนนี้</p>}
    </section>
  );

  if (moduleCode === "RP") return <Navigate to="/menu" replace />;
  if (moduleCode && !selected) return <Result status="403" title="ไม่มีสิทธิ์เข้าถึงหมวดเมนูนี้" extra={<Link to="/menu">กลับเมนูระบบ</Link>} />;
  return <div className="pv-home">
    {!moduleCode && pinnedMenus.length > 0 && <section className="pv-section" aria-label="เมนูปักหมุด">
      <h2><PushpinFilled /> เมนูปักหมุด <small className="pv-pin-count">{pinned.length}/{PINNED_MAX}</small></h2>
      <div className="pv-grid">{pinnedMenus.map(tile)}</div>
    </section>}
    {!moduleCode && recent.length > 0 && <section className="pv-section"><h2>เข้าใช้ล่าสุด</h2><div className="pv-grid">{recent.map(tile)}</div></section>}
    <section className="pv-section">
      <h2>{selected ? selected.code + ' · ' + selected.title : 'เมนูระบบ'}</h2>
      {selected && <p className="pv-pin-hint">กดรูปหมุดบนการ์ดเพื่อเพิ่มเมนูโปรดได้สูงสุด {PINNED_MAX} เมนู</p>}
      <div className={selected ? 'pv-module-sections' : 'pv-grid'}>{selected ? <>
        {sectionPanel('system', 'System', 'งานระบบ')}
        {sectionPanel('master', 'Master', 'ข้อมูลหลัก')}
        {sectionPanel('report', 'Report', 'รายงาน')}
      </> : modules.map(m => {
        const Icon = icons[m.code];
        return <Link key={m.code} className="pv-tile pv-module-tile" to={'/menu/' + m.code}>
          <span className="pv-tile-code">{m.code}</span><Icon className="pv-module-icon" />
          <span className="pv-tile-title">{m.title}</span><span className="pv-tile-sub">{m.english}</span>
        </Link>;
      })}</div>
      {!modules.length && <Empty description="ไม่มีเมนูที่สามารถใช้งานได้" />}
    </section>
  </div>;
}
