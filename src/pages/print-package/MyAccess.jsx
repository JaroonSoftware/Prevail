/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "antd";
import { Collapse, Form, Flex, Row, Col, Space } from "antd";
import { Input, Button, Table, message, DatePicker, Typography } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { accessColumn } from "./model";

import dayjs from "dayjs";
import PackageService from "../../service/Package.service";
import {
  saveMyAccessSearchCookie,
  loadMyAccessSearchCookie,
  clearMyAccessSearchCookie,
} from "../../utils/myaccessSearchCookie";

const pkservice = PackageService();
const mngConfig = {
  title: "",
  textOk: null,
  textCancel: null,
  action: "create",
  code: null,
};

const RangePicker = DatePicker.RangePicker;
const MyAccess = () => {
  const PAGE_COOKIE_KEY = "print-package";
  const navigate = useNavigate();
  const defaultTablePagination = { current: 1, pageSize: 10 };

  const [form] = Form.useForm();

  const [accessData, setAccessData] = useState([]);
  const [activeSearch, setActiveSearch] = useState([]);
  const [tablePagination, setTablePagination] = useState(defaultTablePagination);

  const isFirstLoadRef = useRef(true);

  const getIgnoreLoading = () => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  };

  const CollapseItemSearch = (
    <>
      <Row gutter={[8, 8]}>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="Sale Order Code" name="socode">
            <Input placeholder="Enter Sale Order Code." />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="Sale Order Date." name="sodate">
            <RangePicker
              placeholder={["From Date", "To date"]}
              style={{ width: "100%", height: 40 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="Request By." name="created_by">
            <Input placeholder="Enter First Name or Last Name." />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="Product" name="stname">
            <Input placeholder="Enter Product Name." />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="Customer Code" name="cuscode">
            <Input placeholder="Enter Customer Code." />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8}>
          <Form.Item label="Customer Name" name="cusname">
            <Input placeholder="Enter Customer Name." />
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
              Search
            </Button>
            <Button
              type="primary"
              size="small"
              className="bn-action"
              danger
              icon={<ClearOutlined />}
              onClick={() => handleClear()}
            >
              Clear
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
              <span> Search</span>
            </>
          ),
          children: <>{CollapseItemSearch}</>,
          showArrow: false,
        },
      ]}
      // bordered={false}
    />
  );

  const buildSearchPayload = (values = {}) => {
    const data = { ...values };
    if (!!data?.sodate) {
      const arr = data?.sodate.map((m) => dayjs(m).format("YYYY-MM-DD"));
      const [sodate_form, sodate_to] = arr;
      Object.assign(data, { sodate_form, sodate_to });
    }
    return data;
  };

  const savePageState = (searchValues, pagination = tablePagination) => {
    saveMyAccessSearchCookie(
      PAGE_COOKIE_KEY,
      {
        searchValues,
        tablePagination: {
          current: pagination?.current ?? defaultTablePagination.current,
          pageSize: pagination?.pageSize ?? defaultTablePagination.pageSize,
        },
      },
      7
    );
  };

  const handleSearch = (forcedValues = null, paginationOverride = null) => {
    const values = forcedValues ?? form.getFieldsValue(true);
    const nextPagination = paginationOverride ?? tablePagination;
    savePageState(values, nextPagination);
    const payload = buildSearchPayload(values);
    setTimeout(() => getData(payload), 80);
  };

  const handleClear = () => {
    clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
    form.resetFields();
    setTablePagination(defaultTablePagination);

    handleSearch({}, defaultTablePagination);
  };

  const handleEdit = (data) => {
    navigate("manage/edit", {
      state: {
        config: {
          ...mngConfig,
          title: "แก้ไขใบขายสินค้า",
          action: "edit",
          code: data?.socode,
        },
      },
      replace: true,
    });
  };

  const handlePrintsData = (code) => {
    const url = `/pickup-list-print/${code}`;
    const newWindow = window.open("", url, url);
    newWindow.location.href = url;
  };

  const column = accessColumn({ handleEdit, handlePrintsData });

  const handleTableChange = (pagination) => {
    const nextPagination = {
      current: pagination?.current ?? defaultTablePagination.current,
      pageSize: pagination?.pageSize ?? defaultTablePagination.pageSize,
    };

    setTablePagination(nextPagination);
    savePageState(form.getFieldsValue(true), nextPagination);
  };

  const getData = (data) => {
    pkservice
      .search(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;

        setAccessData(data);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  };

  const init = async () => {
    const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY);
    if (restored?.searchValues || restored?.tablePagination) {
      if (restored?.searchValues) {
        form.setFieldsValue(restored.searchValues);
      }

      if (restored?.tablePagination) {
        setTablePagination({
          current:
            restored.tablePagination.current ?? defaultTablePagination.current,
          pageSize:
            restored.tablePagination.pageSize ?? defaultTablePagination.pageSize,
        });
      }

      return {
        searchValues: restored.searchValues ?? null,
        tablePagination: restored.tablePagination ?? defaultTablePagination,
      };
    }

    if (restored) {
      form.setFieldsValue(restored);
    }

    return {
      searchValues: restored,
      tablePagination: defaultTablePagination,
    };
  };

  useEffect(() => {
    (async () => {
      const restored = await init();
      handleSearch(
        restored?.searchValues ?? null,
        restored?.tablePagination ?? defaultTablePagination
      );
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
            รายการใบขายสำหรับปริ้นหน้าถุง
          </Typography.Title>
        </Flex>
      </Col>
    </Flex>
  );
  return (
    <div className="so-access" id="area">
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
            const nextPagination = {
              ...tablePagination,
              current: defaultTablePagination.current,
            };

            setTablePagination(nextPagination);
            handleSearch(null, nextPagination);
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
                rowKey="qtcode"
                columns={column}
                dataSource={accessData}
                pagination={tablePagination}
                onChange={handleTableChange}
                scroll={{ x: "max-content" }}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default MyAccess;
