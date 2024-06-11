/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, message } from "antd";
import { Collapse, Form, Flex, Row, Col, Space } from "antd";
import { Input, Button, Table, Typography } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { MdGroupAdd } from "react-icons/md";
import { accessColumn } from "./users.model";
import UserService from "../../service/User.service";

const userService = UserService();
const mngConfig = {
  title: "",
  textOk: null,
  textCancel: null,
  action: "create",
  code: null,
};
const UsersAccess = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [accessData, setAccessData] = useState([]);
  const [activeSearch, setActiveSearch] = useState([]);

  const handleSearch = () => {
    form.validateFields().then((v) => {
      const data = { ...v };
      getData(data);
    });
  };

  const handleClear = () => {
    form.resetFields();

    handleSearch();
  };

  const hangleAdd = () => {
    navigate("manage/create", {
      state: {
        config: {
          ...mngConfig,
          title: "เพิ่มผู้ใช้",
          action: "create",
          acname: "เพิ่มผู้ใช้ใหม่",
        },
      },
      replace: true,
    });
  };

  const handleEdit = (data) => {
    // setManageConfig({...manageConfig, title:"แก้ไข Sample Request", action:"edit", code:data?.srcode});
    navigate("manage/edit", {
      state: {
        config: {
          ...mngConfig,
          title: "แก้ไขผู้ใช้",
          action: "edit",
          acname: "แก้ใขข้อมูลผู้ใช้",
          code: data?.code,
        },
      },
      replace: true,
    });
  };

  const handleView = (data) => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `/dln-print/${data.dncode}`;
  };
  const handleDelete = (data) => {
    // startLoading();
    // ctmService.deleted(data?.dncode).then( _ => {
    //     const tmp = accessData.filter( d => d.dncode !== data?.dncode );
    //     setAccessData([...tmp]);
    // })
    // .catch(err => {
    //     console.log(err);
    //     message.error("Request error!");
    // });
  };

  useEffect(() => {
    getData({});
  }, []);

  const getData = (data) => {
    userService
      .search(data)
      .then((res) => {
        const { data } = res.data;

        setAccessData(data);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  };
  const FormSearch = (
    <Collapse
      size="small"
      onChange={(e) => {
        setActiveSearch(e);
      }}
      bordered={false}
      activeKey={activeSearch}
      items={[
        {
          key: "1",
          label: (
            <>
              <Typography.Title level={5}>
                <SearchOutlined />
                ค้นหา
              </Typography.Title>
            </>
          ),
          children: (
            <>
              <Form form={form} layout="vertical" autoComplete="off">
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={8} md={8} lg={8} xl={6}>
                    <Form.Item
                      label="Username"
                      name="username"
                      onChange={handleSearch}
                    >
                      <Input placeholder="ใส่ Username" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} md={8} lg={8} xl={6}>
                    <Form.Item
                      label="ชื่อ"
                      name="firstname"
                      onChange={handleSearch}
                    >
                      <Input placeholder="ใส่ชื่อจริง" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} md={8} lg={8} xl={6}>
                    <Form.Item
                      label="นามสกุล"
                      name="lastname"
                      onChange={handleSearch}
                    >
                      <Input placeholder="ใส่นามสกุล" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} md={8} lg={8} xl={6}>
                    <Form.Item
                      label="เบอร์โทร"
                      name="tel"
                      onChange={handleSearch}
                    >
                      <Input placeholder="ใส่เบอร์โทร" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={8} md={12} lg={12} xl={12}>
                    {/* Ignore */}
                  </Col>
                  <Col xs={24} sm={8} md={12} lg={12} xl={12}>
                    <Flex justify="flex-end" gap={8}>
                      <Button
                        type="primary"
                        size="small"
                        className="bn-action"
                        icon={<SearchOutlined />}
                        onClick={() => handleSearch()}
                      >
                        ค้นหา
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        className="bn-action"
                        danger
                        icon={<ClearOutlined />}
                        onClick={() => handleClear()}
                      >
                        ล้าง
                      </Button>
                    </Flex>
                  </Col>
                </Row>
              </Form>
            </>
          ),
          showArrow: false,
        },
      ]}
    />
  );
  const column = accessColumn({ handleEdit, handleDelete, handleView });
  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายชื่อผู้ใช้
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            size="small"
            className="bn-action bn-center bn-primary-outline justify-center"
            icon={<MdGroupAdd style={{ fontSize: ".9rem" }} />}
            onClick={() => {
              hangleAdd();
            }}
          >
            เพิ่มผู้ใช้
          </Button>
        </Flex>
      </Col>
    </Flex>
  );
  return (
    <div className="User-access">
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", position: "relative" }}
      >
        <Card>
          {FormSearch}
          <br></br>
          <Row gutter={[8, 8]} className="m-0">
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              <Table
                title={() => TitleTable}
                size="small"
                rowKey="cuscode"
                columns={column}
                dataSource={accessData}
                
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default UsersAccess;
