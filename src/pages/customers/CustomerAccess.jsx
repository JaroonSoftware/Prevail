/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, message } from "antd";
import { Collapse, Form, Flex, Row, Col, Space, Select } from "antd";
import { Input, Button, Table, Typography } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { MdOutlineLibraryAdd } from "react-icons/md";
import { accessColumn } from "./customer.model";
import Customerservice from "../../service/Customer.Service";
import { PROVINCE_OPTIONS } from "../../utils/util";
const customerservice = Customerservice();
const mngConfig = {
  title: "",
  textOk: null,
  textCancel: null, 
  action: "create",
  code: null,
};
const ItemsAccess = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [accessData, setAccessData] = useState([]);
  const [activeSearch, setActiveSearch] = useState([]);
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  const handleSearch = () => {
    form.validateFields().then((v) => {
      const data = { ...v };
      customerservice
        .search(data, { ignoreLoading: Object.keys(data).length !== 0 })
        .then((res) => {
          const { data } = res.data;

          setAccessData(data);
        })
        .catch((err) => {
          console.log(err);
          message.error("Request error!");
        });
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
          title: "เพิ่มลูกค้า",
          action: "create",
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
          title: "แก้ไขข้อมูลลูกค้า",
          action: "edit",
          code: data?.cuscode,
        },
      },
      replace: true,
    });
  };

  const handleView = (data) => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `/dln-print/${data.dncode}`;
  };

  useEffect(() => {
    getData({});
  }, []);

  const getData = (data) => {
    customerservice
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
          label: <><SearchOutlined /><span> ค้นหา</span></>,  
          children: (
            <>
              <Form form={form} layout="vertical" autoComplete="off">
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={6} md={6} lg={6} xl={6}>
                    <Form.Item
                      label="รหัสลูกค้า"
                      name="cuscode"
                      onChange={handleSearch}
                    >
                      <Input placeholder="กรอกรหัสลูกค้า" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6} md={6} lg={8} xl={6}>
                    <Form.Item
                      label="ชื่อลูกค้า"
                      name="cusname"
                      onChange={handleSearch}
                    >
                      <Input placeholder="กรอกชื่อลูกค้า" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6} md={6} lg={6} xl={6}>
                    <Form.Item
                      label="จังหวัด"
                      name="province"
                      onChange={handleSearch}
                    >
                      <Select
                        size="large"
                        showSearch
                        filterOption={filterOption}
                        placeholder="เลือกจังหวัด"
                        onChange={handleSearch}
                        options={PROVINCE_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6} md={6} lg={6} xl={6}>
                    <Form.Item
                      label="เบอร์โทร"
                      name="tel"
                      onChange={handleSearch}
                    >
                      <Input placeholder="กรอกเบอร์โทรลูกค้า" />
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
  const column = accessColumn({ handleEdit, handleView });

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายชื่อลูกค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            size="small"
            className="bn-action bn-center bn-primary-outline justify-center"
            icon={<MdOutlineLibraryAdd style={{ fontSize: ".9rem" }} />}
            onClick={() => {
              hangleAdd();
            }}
          >
            เพิ่มลูกค้า
          </Button>
        </Flex>
      </Col>
    </Flex>
  );
  return (
    <div className="item-access">
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

export default ItemsAccess;
