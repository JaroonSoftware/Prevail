import { useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import { Authenticate } from "../../service/Authenticate.service";
import { useNavigate } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import {
  Layout,
  Menu,
  Typography,
  Spin,
  Row,
  Col,
  Modal,
  ConfigProvider,
  Alert,
} from "antd";
const authService = Authenticate();
const App = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ModalLogoutOpen, setModalLogoutOpen] = useState(false);
  // const [current, setCurrent] = useState("menu1");
  const onLogout = () => {
    setLoading(true);
    setTimeout(() => {
      authService.removeToken();
      setLoading(false);
      navigate("/", { replace: true });
    }, 600);
  };
  useEffect(() => {
    const users = authService.getUserInfo();
    setUserInfo(users);

    return () => {};
  }, []);
  // const onClick = (e) => {
  //   // console.log("click ", e);
  //   setCurrent(e.key);
  // };
  return (
    <Spin spinning={loading}>
      <Layout>
        <ConfigProvider
          theme={{
            token: {
              // Seed Token
              colorPrimary: "#F7F9F9",
              colorText: "#FFFFFF",
              colorBgContainer: "#196f3d",
            },
          }}
        >
          <Row style={{ height: 45}}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              <Menu
                // onClick={onClick}
                key={1}
                // selectedKeys={[current]}
                mode="horizontal"
        
              >
                <Menu.Item>
                  <HomeOutlined style={{ paddingRight: 5 }} />
                  <Typography.Link href="/shipping" rel="noopener noreferrer">
                    Home
                  </Typography.Link>
                </Menu.Item>
                <Menu.Item
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "#196f3d",
                  }}
                >
                  <Typography.Link
                    onClick={() => setModalLogoutOpen(true)}
                    rel="noopener noreferrer"
                  >
                    <UserOutlined />
                    <span
                      style={{
                        letterSpacing: 0.7,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        paddingRight: 10,
                      }}
                    >
                      {userInfo?.prename}
                      {userInfo?.firstname}
                      {userInfo?.lastname}
                    </span>
                  </Typography.Link>
                </Menu.Item>
              </Menu>
            </Col>
          </Row>
        </ConfigProvider>
      </Layout>

      <Modal
        title="ออกจากระบบ"
        open={ModalLogoutOpen}
        onOk={onLogout}
        onCancel={() => setModalLogoutOpen(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          style: { backgroundColor: "#fa3f3f", color: "#FFFFFF" },
        }}
        cancelButtonProps={{
          style: { color: "#17202a" },
        }}
      >
        <Alert
          message="คุณแน่ใจหรือไม่ ว่าต้องการออกจากระบบ"
          type="warning"
          showIcon
        />
      </Modal>
    </Spin>
  );
};
export default App;
