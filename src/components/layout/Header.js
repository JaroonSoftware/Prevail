/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import {
  Row,
  Col,
  Breadcrumb,
  Dropdown,
  Space,
  Typography,
  Button,

} from "antd";

import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
// import styled from "styled-components";
import { Authenticate } from "../../service/Authenticate.service";
import { capitalized } from "../../utils/util";

import { useLoadingContext } from "../../store/context/loading-context";
const authService = Authenticate();
function Header({
  placement,
  name,
  subName,
  onPress,
  handleSidenavColor,
  handleSidenavType,
  handleFixedNavbar,
}) {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoadingContext();
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    return window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const users = authService.getUserInfo();
    setUserInfo(users);

    return () => {};
  }, []);

  const toggler = [
    <svg
      width="30"
      height="30"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      key={0}
    >
      <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
    </svg>,
  ];
  const getIndexRoute = (r) => {
    const linkRoute = r.split("/");
    let routeString = r
      .split("/")
      .slice(0, 2)
      .map((m, index) => {
        let rInx = linkRoute.filter((f, i) => i <= index);

        return {
          title: capitalized(m),
          href: `/${rInx.join("/")}${
            index > 0 ? `/${r.split("/").slice(2).join("/")}` : ""
          }`,
        };
      });

    return routeString;
  };

  const onLogout = () => {
    startLoading();
    setTimeout(() => {
      authService.setCurrent(`/${subName}`);
      authService.removeToken();
      stopLoading().then((_) => {
        navigate("/", { replace: true });
      });
    }, 800);
  };
  const items = [
    {
      label: (
        <>
          <Typography.Link
            onClick={() => onLogout()}
            className="btn-sign-in"
            style={{ border: "none", backgroundColor: "inherit" }}
          >
            <span>Log out</span>
          </Typography.Link>
        </>
      ),
      key: "0",
    },
  ];

  return (
    <>
      {/* <div className="setting-drwer" onClick={showDrawer}>
        {setting}
      </div> */}
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={24}
          xxl={24}
          className="header-control"
        >
          <Button
            type="link"
            className="sidebar-toggler"
            onClick={() => onPress()}
          >
            {toggler}
          </Button>
          
        </Col>
       
      </Row>
     
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
          <Breadcrumb
            items={[{ title: "Home", href: "/" }, ...getIndexRoute(name)]}
          />
          <div className="ant-page-header-heading">
            <span
              className="ant-page-header-heading-title"
              style={{ textTransform: "capitalize" }}
            >
              {subName
                .split("/")
                .map((d) => capitalized(d))
                .slice(0, 2)
                .join(" : ")}
            </span>
          </div>
        </Col>
        <Col
          xs={12}
          sm={12}
          md={12}
          lg={12}
          xl={12}
          xxl={12}
          className="header-control"
        >
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            style={{ minWidth: 200 }}
          >
            <Typography.Link onClick={(e) => e.preventDefault()}>
              <Space className="gap-2">
                <UserOutlined />
                <span
                  style={{
                    letterSpacing: 0.7,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  <Typography.Text style={{ color: "#5e5f61" }}>
                    {userInfo?.firstname} {userInfo?.lastname}
                  </Typography.Text>
                </span>
              </Space>
            </Typography.Link>
          </Dropdown>
        </Col>
      </Row>
    </>
  );
}

export default Header;
