import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Flex,
  Col,
  Button,
  message,
  Collapse,
  Form,
  Row,
  Space,
  DatePicker,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { MdRamenDining } from "react-icons/md";
import dayjs from "dayjs";

import { columns } from "./model";
import ReportService from "../../../service/Report.service";
import {
  saveMyAccessSearchCookie,
  loadMyAccessSearchCookie,
  clearMyAccessSearchCookie,
} from "../../../utils/myaccessSearchCookie";

const rpservice = ReportService();
const RangePicker = DatePicker.RangePicker;
const PAGE_COOKIE_KEY = "curry-paste-report";

const CurryPasteReport = () => {
  const [form] = Form.useForm();
  const [listDetail, setListDetail] = useState([]);
  const [activeSearch, setActiveSearch] = useState([]);
  const isFirstLoadRef = useRef(true);

  const getIgnoreLoading = useCallback(() => {
    const ignoreLoading = !isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    return ignoreLoading;
  }, []);

  const getData = useCallback((data) => {
    rpservice
      .getCurry(data, { ignoreLoading: getIgnoreLoading() })
      .then((res) => {
        const { data } = res.data;
        setListDetail(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  }, [getIgnoreLoading]);

  const buildSearchPayload = useCallback((values = {}) => {
    const data = { ...values };
    if (data?.sodate) {
      const arr = data.sodate.map((value) => dayjs(value).format("YYYY-MM-DD"));
      const [sodate_form, sodate_to] = arr;
      Object.assign(data, { sodate_form, sodate_to });
    }
    delete data.sodate;
    return data;
  }, []);

  const savePageState = useCallback((searchValues) => {
    saveMyAccessSearchCookie(
      PAGE_COOKIE_KEY,
      {
        searchValues,
      },
      7
    );
  }, []);

  const handleSearch = useCallback(
    (forcedValues = null) => {
      const values = forcedValues ?? form.getFieldsValue(true);
      savePageState(values);
      const payload = buildSearchPayload(values);

      getData(payload);
    },
    [buildSearchPayload, form, getData, savePageState]
  );

  const handleClear = useCallback(() => {
    clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
    form.resetFields();
    handleSearch({});
  }, [form, handleSearch]);

  const init = useCallback(async () => {
    const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY);

    if (restored?.searchValues) {
      form.setFieldsValue(restored.searchValues);
      return restored.searchValues;
    }

    return {};
  }, [form]);

  useEffect(() => {
    (async () => {
      const restoredSearchValues = await init();
      handleSearch(restoredSearchValues);
    })();

    return async () => {};
  }, [handleSearch, init]);

  const formSearch = (
    <Collapse
      size="small"
      bordered={false}
      activeKey={activeSearch}
      onChange={(keys) => setActiveSearch(keys)}
      items={[
        {
          key: "1",
          label: (
            <>
              <SearchOutlined />
              <span> ค้นหา</span>
            </>
          ),
          showArrow: false,
          children: (
            <>
              <br />
              <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                onValuesChange={(changedValues) => {
                  if (Object.prototype.hasOwnProperty.call(changedValues, "sodate")) {
                    handleSearch();
                  }
                }}
              >
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Form.Item label="วันที่เอกสาร" name="sodate">
                      <RangePicker
                        placeholder={["From Date", "To Date"]}
                        style={{ width: "100%", height: 40 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    {/* Ignore */}
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
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
        },
      ]}
    />
  );

  const titleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <MdRamenDining style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
              <span>รายงานเครื่องแกง</span>
            </span>
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            size="small"
            className="bn-action bn-center bn-primary justify-center"
            icon={<ReloadOutlined style={{ fontSize: ".9rem" }} />}
            onClick={() => handleSearch()}
          >
            Refresh
          </Button>
          <Button
            size="small"
            className="bn-action bn-center bn-primary-outline justify-center"
            icon={<PrinterOutlined style={{ fontSize: ".9rem" }} />}
            onClick={() => {
              const url = `${window.location.origin}/curry-paste-report-print`;
              const newWindow = window.open("", url, url);
              newWindow.location.href = url;
            }}
          >
            Print Report
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  const columnDefs = useMemo(() => columns(), []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "16px 12px",
        boxSizing: "border-box",
      }}
    >
      <Space
        direction="vertical"
        size="middle"
        style={{ display: "flex", width: "100%", maxWidth: 1024 }}
      >
        {formSearch}
        <Card
          title={titleTable}
          style={{
            width: "100%",
            borderRadius: 12,
          }}
          bodyStyle={{ padding: 12 }}
        >
          <Table
            size="small"
            rowKey="key"
            columns={columnDefs}
            dataSource={listDetail}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "ไม่มีรายการ" }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default CurryPasteReport;