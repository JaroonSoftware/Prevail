/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "antd";
import { Collapse, Form, Flex, Row, Col, Space } from "antd";
import { Input, Button, Table, message, Typography } from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { accessColumn } from "./model";
import CatalogService from "../../service/Catalog.Service";
import {
  saveMyAccessSearchCookie,
  loadMyAccessSearchCookie,
  clearMyAccessSearchCookie,
} from "../../utils/myaccessSearchCookie";
const clService = CatalogService();
const mngConfig = {
  title: "",
  textOk: null,
  textCancel: null,
  action: "create",
  code: null,
};
const CatalogAccess = () => {
  const PAGE_COOKIE_KEY = "catalog";
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isFirstLoadRef = useRef(true);
  const getIgnoreLoading = () => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  };

  const [accessData, setAccessData] = useState([]);
  const [activeSearch, setActiveSearch] = useState([]);
  const CollapseCatalogSearch = (
    <>
      <Row gutter={[8, 8]}>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="รหัสแคตตาล๊อก" name="catalog_code">
            <Input placeholder="ใส่รหัส แคตตาล๊อก" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="ชื่อแคตตาล๊อก" name="catalog_name">
            <Input placeholder="ใส่ชื่อ แคตตาล๊อก" />
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
              ค้าหา
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
    </>
  );
  const FormSearch = (
    <Collapse
      size="small"
      onChange={(e) => {
        setActiveSearch(e);
      }}
      activeKey={activeSearch}
      items={[
        {
          key: "1",
          label: (
            <>
              <SearchOutlined />
              <span> ค้นหา</span>
            </>
          ),
          children: <>{CollapseCatalogSearch}</>,
          showArrow: false,
        },
      ]}
      // bordered={false}
    />
  );
  const requestSearch = (payload) => {
    setTimeout(
      () =>
        clService
          .search(payload, { ignoreLoading: getIgnoreLoading() })
          .then((res) => {
            const { data } = res.data;

            setAccessData(data);
          })
          .catch((err) => {
            console.log(err);
            message.error("Request error!");
          }),
      80
    );
  };

  const handleSearch = (forcedValues = null) => {
    const v = forcedValues ?? form.getFieldsValue(true);
    saveMyAccessSearchCookie(PAGE_COOKIE_KEY, v, 7);
    requestSearch({ ...v });
  };
  const handleClear = () => {
    clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
    form.resetFields();
    handleSearch();
  };
  // console.log(form);
  const hangleAdd = () => {
    navigate("manage/create", {
      state: {
        config: { ...mngConfig, title: "สร้างแคตตาล๊อก", action: "create" },
      },
    });
  };

  const handleEdit = (data) => {
    navigate("manage/edit", {
      state: {
        config: {
          ...mngConfig,
          title: "แก้ไขแคตตาล๊อก",
          action: "edit",
          code: data?.catalog_code,
        },
      },
      replace: true,
    });
  };

  const handleDelete = (data) => {
    // startLoading();
    clService
      .deleted(data?.quotcode)
      .then((_) => {
        const tmp = accessData.filter((d) => d.clService !== data?.clService);

        setAccessData([...tmp]);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  };
  const column = accessColumn({ handleEdit, handleDelete });

  const init = async () => {
    const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY);
    if (restored) {
      form.setFieldsValue(restored);
    }
    return restored;
  };

  useEffect(() => {
    (async () => {
      const restored = await init();
      handleSearch(restored ?? null);
    })();

    return async () => {
      //console.clear();
    };
  }, []);
  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการแคตตาล๊อก
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            size="small"
            className="bn-action bn-center bn-primary-outline justify-center"
            icon={<FileAddOutlined style={{ fontSize: ".9rem" }} />}
            onClick={() => {
              hangleAdd();
            }}
          >
            เพิ่มแคตตาล็อก
          </Button>
        </Flex>
      </Col>
    </Flex>
  );
  return (
    <div className="catalog-access" id="area">
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", position: "relative" }}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          onValuesChange={() => {
            handleSearch();
          }}
        >
          {FormSearch}
        </Form>
        <Card>
          <Row gutter={[8, 8]} className="m-0">
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              <Table
                title={() => TitleTable}
                size="small"
                rowKey="catalog_code"
                columns={column}
                dataSource={accessData}
                scroll={{ x: "max-content" }}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default CatalogAccess;
