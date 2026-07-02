/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Menu, MenuItem } from "react-pro-sidebar";
import { Badge, Flex } from "antd";
import { CloseCircleFilled, SearchOutlined } from "@ant-design/icons";
import logo from "../../assets/images/logo.png";
import nav from "../../nav";

import { Authenticate } from '../../service/Authenticate.service.js'; 
// import { useAppDispatch } from '../../store/store';

const SIDENAV_SEARCH_COOKIE = "prevail_sidenav_search";
const RECENT_MENU_COOKIE = "prevail_recent_menus";
const RECENT_MENU_LIMIT = 10;
const RECENT_MENU_EXCLUDE = ["/dashboard"];

const getCookieValue = (name) => {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = cookies.find((item) => item.startsWith(`${name}=`));

  if (!target) {
    return "";
  }

  return decodeURIComponent(target.split("=").slice(1).join("="));
};

const setCookieValue = (name, value, days = 30) => {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getRecentMenus = () => {
  try {
    const raw = getCookieValue(RECENT_MENU_COOKIE);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
};

const Sidenav = () => {
  const authService =  Authenticate();
  const userInfo = authService.getUserInfo();
  const currentUsername = userInfo?.username || userInfo?.userid || "";
  const currentRole = authService.getType()?.toLowerCase() || "";
  const [search, setSearch] = useState(() => getCookieValue(SIDENAV_SEARCH_COOKIE));
  const [recentMenus, setRecentMenus] = useState(getRecentMenus);
  // const [ waitApprove, setWaitAppreve ] = useState(0);
  // const dispatch = useAppDispatch();
  
  const { pathname } = useLocation();
  const navActiveStyle = {
    padding: "10px 16px",
    color: "#141414",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 20px 27px rgba(0,0,0,.05)",
  }

  useEffect(() => {
    setCookieValue(SIDENAV_SEARCH_COOKIE, search);
  }, [search]);

  // เก็บประวัติการเข้าเมนูล่าสุด (ยกเว้น Dashboard) ลง cookie สูงสุด 6 เมนู
  useEffect(() => {
    const current = nav
      .filter(
        (item) =>
          !item?.type &&
          !!item?.to &&
          !RECENT_MENU_EXCLUDE.includes(item.to) &&
          pathname.startsWith(item.to)
      )
      .sort((a, b) => b.to.length - a.to.length)[0];
    if (!current) return;

    setRecentMenus((prev) => {
      const next = [
        current.to,
        ...prev.filter((to) => to !== current.to),
      ].slice(0, RECENT_MENU_LIMIT);
      setCookieValue(RECENT_MENU_COOKIE, JSON.stringify(next));
      return next;
    });
  }, [pathname]);

  // สิทธิ์การมองเห็นเมนู (ใช้ทั้งเมนูหลัก และเมนูเข้าล่าสุด)
  const allowNavItem = (item) => {
    const allowRole = !item.role || !!item?.role?.includes(currentRole);
    const pinnedUsername = !!item.usernames?.includes(currentUsername);
    const allowUsername = !item.usernames || pinnedUsername;
    const hideForRole = !!item.hiddenRoles
      ?.map((role) => role?.toLowerCase())
      .includes(currentRole);

    // usernames whitelist overrides hiddenRoles
    if (pinnedUsername) return true;
    return allowRole && allowUsername && !hideForRole;
  };

  const recentNavItems = recentMenus
    .map((to) => nav.find((item) => !item?.type && item?.to === to))
    .filter((item) => !!item && allowNavItem(item));

  const Notification = ( {title}) => {
    // console.log(title);
    switch(title){
      case "Sample Preparation" :
        return (
          <Badge dot={ authService.getType() === 'admin'  } size="small" offset={[1, 2]}> 
            <span>
              {title} 
            </span>
          </Badge>
        );
      default: return (<><span>{title}</span></>)
    }
  }
  // ฟังก์ชันกรองเมนูตามข้อความค้นหา
  const filterNav = (navList) =>
    navList.filter(
      (item) =>
        !item.title || // สำหรับ group header
        item.title.toLowerCase().includes(search.toLowerCase())
    );

  const filteredMenuCount = filterNav(nav).filter((item) => !item?.type).length;

  return (
    <>
      <Flex vertical className="brand width-100" justify='center' align='center' >
        <img src={logo} alt="Prevail logo" style={{width:160, height:80}}  />        
      </Flex>
<hr />
      <div
        style={{
          width: "calc(100% - 20px)",
          margin: "0 auto 14px",
          padding: "10px",
          borderRadius: 14,
          background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
          border: "1px solid #d8e7ff",
          boxShadow: "0 10px 24px rgba(64, 103, 173, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            paddingInline: 2,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "#4a6ea8",
            }}
          >
            Menu Search
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: search ? "#2f5fb3" : "#7e90ad",
            }}
          >
            {filteredMenuCount} รายการ
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 12,
            backgroundColor: "#ffffff",
            border: search ? "1px solid #7aa7ff" : "1px solid #d7dfeb",
            boxShadow: search
              ? "0 0 0 4px rgba(91, 141, 239, 0.16)"
              : "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <SearchOutlined style={{ fontSize: 16, color: search ? "#2f5fb3" : "#8a94a6" }} />
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              fontWeight: 500,
              color: "#1f2937",
            }}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="ล้างข้อความค้นหา"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#8a94a6",
              }}
            >
              <CloseCircleFilled style={{ fontSize: 16 }} />
            </button>
          ) : null}
        </div>
      </div>
      {recentNavItems.length > 0 && !search ? (
        <div style={{ width: "calc(100% - 20px)", margin: "0 auto 6px" }}>
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "#4a6ea8",
              padding: "0 2px 4px",
            }}
          >
            เข้าล่าสุด
          </span>
          <Menu theme="light" mode="inline">
            {recentNavItems.map((item) => (
              <MenuItem
                icon={item?.icon}
                key={`recent-${item?.to}`}
                component={<Link to={item?.to} />}
                className={pathname.startsWith(item?.to) ? "nav-active" : null}
              >
                <span>{item?.title}</span>
              </MenuItem>
            ))}
          </Menu>
          <hr style={{ margin: "8px 0 0" }} />
        </div>
      ) : null}
      {/* <Sidebar style={{minWidth:"100%", width:"100%"}} > */}
        <Menu theme="light" mode="inline">
        {filterNav(nav).filter(allowNavItem).map((item, idx) => (
          ( !item?.type ? (
              <MenuItem
                icon={item?.icon}
                key={idx}
                component={ <Link to={item?.to} style={{navActiveStyle}} /> }
                className={pathname.startsWith(item?.to)? "nav-active" : null}
              > 
                <Notification title={item?.title} />
              </MenuItem>
            ) : (
              <MenuItem key={idx} className="nav-group-title">
                {item?.title}
              </MenuItem>
            ))
        ))}
        </Menu>
      {/* </Sidebar> */}
    </>
  );
};

export default Sidenav;
