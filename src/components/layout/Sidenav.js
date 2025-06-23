/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Menu, MenuItem } from "react-pro-sidebar";
import { Badge, Flex } from "antd";
import logo from "../../assets/images/logo.png";
import nav from "../../nav";

import { Authenticate } from '../../service/Authenticate.service.js'; 
// import { useAppDispatch } from '../../store/store';
const Sidenav = () => {
  const authService =  Authenticate();
  const [search, setSearch] = useState("");
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
  return (
    <>
      <Flex vertical className="brand width-100" justify='center' align='center' >
        <img src={logo} alt="Prevail logo" style={{width:160, height:80}}  />        
      </Flex>
<hr />
      <input
        type="text"
        placeholder="ค้นหาเมนู..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "90%", marginBottom: 8, padding: 0,marginLeft: 18 }}
      />
      {/* <Sidebar style={{minWidth:"100%", width:"100%"}} > */}
        <Menu theme="light" mode="inline">
        {filterNav(nav).filter( (item) => {
            return ( !item.role || !!item?.role?.includes( authService.getType()?.toLowerCase() ) );
          }).map((item, idx) => (
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
