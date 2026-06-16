/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { React, useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Button,
  Typography,
  Card,
  Form,
  Input,
  Space,
  Flex,
  Modal,
  Table,
} from "antd";
import { message } from "antd";
import logo4 from "../assets/images/logo.png";
import SystemService from "../service/System.service";
import { Authenticate } from "../service/Authenticate.service";
import ReportService from "../service/Report.service";
import { formatMoney } from "../utils/util";
import {
  buildCustomerSummary,
  filterCustomersOverdueByMonths,
  formatThaiDate,
} from "./reports/outstanding-by-customer-report/reportHelpers";

const { Title } = Typography;
const { Header, Footer, Content } = Layout;
const authService = Authenticate();
const rpservice = ReportService();
const OVERDUE_MONTHS_THRESHOLD = 3;
const SHIPPING_STAFF_TYPE = "พนักงานส่งสินค้า";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [logined, setLogined] = useState(false);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const [overdueCustomers, setOverdueCustomers] = useState([]);
  useEffect(() => {
    const isLogin = () => {
      const isAuthen = authService.isExpireToken();
      if (!!isAuthen) direcetSystem();
      else setLogined(true);
    };

    // console.log(curLocation);
    // setCurr(curLocation);
    isLogin();

    // SystemService.getUnit()
    //   .then((res) => {
    //     let { status, data } = res;
    //     if (status === 200) {
    //       console.log(data);
    //     }
    //   })
    //   .catch((err) => {});
  }, []);

  const onFinish = (values) => {
    // alert(values.password, values);
    Connectapp(values);
  };
  const direcetSystem = () => {
    const type = authService.getType();

    if(type!=='พนักงานส่งสินค้า')
    navigate("/dashboard", { replace: true });
    else
    navigate("/shipping", { replace: true });
  };

  const checkOverdueCustomers = async () => {
    try {
      const res = await rpservice.getOutstandingByCustomer({}, { ignoreLoading: true });
      const rows = res?.data?.data || [];
      const customerRows = buildCustomerSummary(rows);
      const overdue = filterCustomersOverdueByMonths(customerRows, OVERDUE_MONTHS_THRESHOLD);

      if (overdue.length > 0) {
        setOverdueCustomers(overdue);
        setOverdueModalOpen(true);
        return;
      }
    } catch (err) {
      console.log(err);
    }

    direcetSystem();
  };

  const handleOverdueModalProceed = () => {
    setOverdueModalOpen(false);
    direcetSystem();
  };

  const handleViewOverdueReport = () => {
    setOverdueModalOpen(false);
    navigate("/outstanding-by-customer-report");
  };

  const Connectapp = (values) => {
    SystemService.signIn(values)
      .then((res) => {
        let { status, data } = res;
        const { token } = data;
        if (status === 200) {
          if (data?.status === "1") {
            authService.setToken(token);

            const type = authService.getType();
            if (type === SHIPPING_STAFF_TYPE) {
              direcetSystem();
            } else {
              checkOverdueCustomers();
            }
          } else {
            Modal.error({
              title: <strong>{data.message}</strong>,
              content: "Login request failed...",
            });
            // Swal.fire({
            //   title: "<strong>" + data.message + "</strong>",
            //   html: "ผิดพลาด",
            //   icon: "error",
            // });
          }
        } else {
          Modal.error({
            title: <strong>Login ผิดพลาด!</strong>,
            content: "Login request failed...",
          });
          // Swal.fire({
          //   title: "<strong>Login ผิดพลาด!</strong>",
          //   html: data.message,
          //   icon: "error",
          // });
        }
      })
      .catch((err) => {
        message.error("Login request failed.");
      });
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <>
      {logined ? (
        <div className="layout-default ant-layout layout-sign-up">
          <Header></Header>

          <Content className="p-0">
            <div className="sign-up-header">
              <div className="content">
                <Title>LOGIN</Title>
                <p className="text-lg">
                  Enter your username and password to login
                </p>
              </div>
            </div>
            <Card
              className="card-signup header-solid ant-card pt-0"
              bordered="false"
            >
              <Space direction="vertical" className="width-100" size={12}>
                <div className="sign-up-gateways flex justify-center">
                  <img
                    style={{ width: 150 }}
                    src={logo4}
                    alt="่ninestartfood, jaroon logo"
                  />
                </div>
                <Form
                  name="basic"
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  className="row-col"
                >
                  <Flex gap={8} className="width-100 px-2 md:px-5" vertical>
                    <Form.Item
                      name="username"
                      rules={[
                        { required: true, message: "กรุณากรอก username!" },
                      ]}
                    >
                      <Input placeholder="Username" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: "กรุณาใส่รหัสผ่าน!" }]}
                    >
                      <Input.Password
                        placeholder="Password"
                        className="input-40"
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        style={{ width: "100%" }}
                        type="primary"
                        htmlType="submit"
                      >
                        LOGIN
                      </Button>
                    </Form.Item>
                  </Flex>
                </Form>
              </Space>
            </Card>
          </Content>
          <Footer>
            <p className="copyright">
              <a href="https://www.facebook.com/jaroonsoft">
                {" "}
                Jaroon Software Co., Ltd.{" "}
              </a>
            </p>
          </Footer>
        </div>
      ) : (
        <Navigate to="/login" state={{ from: location }} replace />
      )}

      <Modal
        title="แจ้งเตือนลูกค้าค้างจ่ายเกินกำหนด"
        open={overdueModalOpen}
        onCancel={handleOverdueModalProceed}
        width={680}
        footer={[
          <Button key="view" onClick={handleViewOverdueReport}>
            ดูรายงานค้างจ่าย
          </Button>,
          <Button key="ok" type="primary" onClick={handleOverdueModalProceed}>
            เข้าใช้งานระบบ
          </Button>,
        ]}
      >
        <Typography.Paragraph className="!mb-3">
          พบลูกค้าที่มียอดค้างจ่ายเกินกำหนดมากกว่า {OVERDUE_MONTHS_THRESHOLD} เดือน จำนวน{" "}
          <strong>{overdueCustomers.length}</strong> ราย
        </Typography.Paragraph>
        <Table
          size="small"
          rowKey="key"
          pagination={false}
          dataSource={overdueCustomers}
          scroll={{ y: 320 }}
          columns={[
            { title: "รหัสลูกค้า", dataIndex: "cuscode" },
            { title: "ชื่อลูกค้า", dataIndex: "cusname" },
            {
              title: "จำนวนใบวางบิล",
              dataIndex: "billCount",
              align: "right",
              render: (v) => formatMoney(v, 0),
            },
            {
              title: "ยอดค้างจ่าย",
              dataIndex: "totalOutstanding",
              align: "right",
              render: (v) => formatMoney(v, 2),
            },
            {
              title: "ครบกำหนดใกล้สุด",
              dataIndex: "nearestDueDate",
              render: (v) => formatThaiDate(v),
            },
          ]}
        />
      </Modal>
    </>
  );
};

export default Login;
