/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Flex, message, Badge, Card, Select } from "antd";
import { Row, Col, Space } from "antd";
import { SaveFilled } from "@ant-design/icons";
import { ButtonBack } from "../../components/button";
import { Items } from "./items.model";
import { useLocation, useNavigate } from "react-router";
import { delay } from "../../utils/util";
// import OptionService from '../../service/Options.service';
import Itemservice from "../../service/Items.Service";
import OptionService from "../../service/Options.service";



const itemservice = Itemservice();
const opService = OptionService();
const from = "/items";
const ItemsManage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  const [formDetail, setFormDetail] = useState(Items);
  const [optionUnit, setOptionUnit] = useState([]);
  const [optionType, setOptionType] = useState([]);  

  
  useEffect(() => {
    // setLoading(true);
    GetItemsUnit();
    GetItemsType();    

    if (config?.action !== "create") {
      getsupData(config.code);
    }
    // console.log(config);

    return () => {
      form.resetFields();
    };
  }, []);

  const GetItemsType = () => {
    opService.optionsItemstype().then((res) => {
      let { data } = res.data;
      setOptionType(data);
    });
  };

  const GetItemsUnit = () => {
    opService.optionsUnit().then((res) => {
      let { data } = res.data;
      setOptionUnit(data);
    });
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const getsupData = (v) => {
    itemservice
      .get(v)
      .then(async (res) => {
        const { data } = res.data;

        const init = {
          ...data,
        };

        setFormDetail(init);
        form.setFieldsValue({ ...init });
      })
      .catch((err) => {
        console.log(err);
        message.error("Error getting infomation Product.");
      });
  };

  const handleConfirm = () => {
    form.validateFields().then((v) => {
      const source = { ...formDetail, ...v };
      const actions =
        config?.action !== "create"
          ? itemservice.update(source)
          : itemservice.create(source);

      actions
        .then(async (r) => {
          message.success("Request success.");
          navigate(from, { replace: true });
          await delay(300);
          console.clear();
        })
        .catch((err) => {
          console.warn(err);
          const data = err?.response?.data;
          message.error(data?.message || "บันทึกไม่สำเร็จ");
        });
    });
  };

  const Detail = (
    <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
        <Form.Item
          label="รหัสสินค้า"
          name="stcode"
          rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
        >
          <Input
            disabled={config.action === "edit"}
            placeholder="กรอกรหัสสินค้า"
         
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
        <Form.Item
          label="ชื่อสินค้า"
          name="stname"
          rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
        >
          <Input placeholder="กรอกชื่อสินค้า" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
        <Form.Item label="หน่วยสินค้า" name="unit">
          <Select size="large" showSearch
              filterOption={filterOption}
              placeholder="เลือกหน่วยสินค้า"
              options={optionUnit.map((item) => ({
                value: item.label,
                label: item.label,
              }))}/>
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
        <Form.Item label="ประเภทสินค้า" name="typecode">
          <Select size="large" showSearch
              filterOption={filterOption}
              placeholder="เลือกประเภทสินค้า"
              options={optionType.map((item) => ({
                value: item.typecode,
                label: item.typename,
              }))} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
        <Form.Item label="ราคาขาย" name="price">
          <Input placeholder="กรอกราคาขาย" />
        </Form.Item>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={12}
        lg={12}
        xl={12}
        xxl={4}
        style={
          config.action === "edit" ? { display: "inline" } : { display: "none" }
        }
      >
        <Form.Item label="สถานการใช้งาน" name="active_status">
          <Select
            size="large"
            options={[
              {
                value: "Y",
                label: <Badge status="success" text="เปิดการใช้งาน" />,
              },
              {
                value: "N",
                label: <Badge status="error" text="ปิดการใช้งาน" />,
              },
            ]}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const SectionBottom = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={from} />
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            icon={<SaveFilled style={{ fontSize: "1rem" }} />}
            type="primary"
            style={{ width: "9.5rem" }}
            onClick={() => {
              handleConfirm();
            }}
          >
            บันทึก
          </Button>
        </Flex>
      </Col>
    </Row>
  );

  return (
    <div className="item-manage xs:px-0 sm:px-0 md:px-8 lg:px-8">
      <Space direction="vertical" className="flex gap-2">
        <Form form={form} layout="vertical" autoComplete="off">
          <Card title={config?.title}>{Detail}</Card>
        </Form>
        {SectionBottom}
      </Space>
    </div>
  );
};

export default ItemsManage;
