/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Flex,
  message,
  Radio,
  Select,
  Divider,
  Card,
} from "antd";
import { Row, Col, Space } from "antd";
import { SaveFilled } from "@ant-design/icons";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router";
import { delay } from "../../utils/util";
// import OptionService from '../../service/Options.service';
import Supplierservice from "../../service/Supplier.Service";
import { CreateInput } from "thai-address-autocomplete-react";
const InputThaiAddress = CreateInput();

const supplierservice = Supplierservice();
// const opservice = OptionService();
const from = "/supplier";
const MyManage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  const [formDetail, setFormDetail] = useState({});

  const init = async () => {
    const supcodeRes = await supplierservice
      .getcode()
      .catch(() => message.error("Initail failed"));

    const { data: supcode } = supcodeRes;
    const initForm = { ...formDetail, supcode };
    setFormDetail((state) => ({ ...state, ...initForm }));
    form.setFieldsValue(initForm);
  };

  useEffect(() => {
    // setLoading(true);

    if (config?.action !== "create") {
      getsupData(config.code);
    } else {
      init();
      return () => {
        form.resetFields();
      };
    }
  }, []);

  const getsupData = (v) => {
    supplierservice
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
  const handleSelect = (address) => {
    const f = form.getFieldsValue();
    const addr = {
      ...f,
      province: `จ.${address.province}`,
      zipcode: `${address.zipcode}`,
      subdistrict: `ต.${address.district}`,
      district: `อ.${address.amphoe}`,
    };
    setFormDetail(addr);
    form.setFieldsValue(addr);
  };
  const handleConfirm = () => {
    form.validateFields().then((v) => {
      const source = { ...formDetail, ...v };
      const actions =
        config?.action !== "create"
          ? supplierservice.update(source)
          : supplierservice.create(source);

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

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const Detail = () => (
    <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
      <Col xs={24} sm={24} md={24} lg={6} xl={6} xxl={4}>
        <Form.Item
          label="รหัสผู้ขาย"
          name="supcode"
          rules={[{ required: true, message: "Please enter data!" }]}
        >
          <Input
            placeholder="กรอกรหัสผู้ขาย"
            className="!bg-zinc-300"
            readOnly
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={4} xl={4} xxl={4}>
        <Form.Item
          label="คำน้ำหน้า"
          name="prename"
          rules={[{ required: true, message: "กรุณากรอกข้อมูล!" }]}
        >
          <Select
            size="large"
            placeholder="เลือกคำนำหน้าชื่อ"
            showSearch
            filterOption={filterOption}
            options={[
              {
                value: "บจก.",
                label: "บจก.",
              },
              {
                value: "หจก.",
                label: "หจก.",
              },
              {
                value: "คุณ",
                label: "คุณ",
              },
              {
                value: "นาย",
                label: "นาย",
              },
              {
                value: "นาง",
                label: "นาง",
              },
              {
                value: "นางสาว",
                label: "นางสาว",
              },
            ]}
          ></Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={14} xl={14} xxl={6}>
        <Form.Item
          label="ชื่อผู้ขาย"
          name="supname"
          rules={[{ required: true, message: "กรุณากรอกข้อมูล!" }]}
        >
          <Input placeholder="กรอกชื่อผู้ขาย" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={6}>
        <Form.Item label="เลขที่ผู้เสียภาษี" name="taxnumber">
          <Input placeholder="กรอกเลขที่ผู้เสียภาษี" />
        </Form.Item>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={12}
        lg={6}
        xl={6}
        xxl={4}
        style={config === "edit" ? { display: "inline" } : { display: "none" }}
      >
        <Form.Item label="สถานะ" name="active_status">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="Y">Enable</Radio.Button>
            <Radio.Button value="N">Disable</Radio.Button>
          </Radio.Group>
        </Form.Item>
      </Col>
    </Row>
  );

  const AddressDetail = () => (
    <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={4}>
        <Form.Item label="เลขที่" name="idno">
          <Input placeholder="กรอกเลขที่อยู่" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={4}>
        <Form.Item label="ถนน" name="road">
          <Input placeholder="กรอกถนน" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={4}>
        <Form.Item label="ตำบล" name="subdistrict">
          <InputThaiAddress.District
            onSelect={handleSelect}
            style={{ height: 40 }}
            autoCompleteProps={{ placeholder: "กรอกตำบล" }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={4}>
        <Form.Item label="อำเภอ" name="district">
          <InputThaiAddress.Amphoe
            onSelect={handleSelect}
            style={{ height: 40 }}
            autoCompleteProps={{ placeholder: "กรอกอำเภอ" }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={4}>
        <Form.Item label="จังหวัด" name="province">
          <InputThaiAddress.Province
            onSelect={handleSelect}
            style={{ height: 40 }}
            autoCompleteProps={{ placeholder: "กรอกจังหวัด" }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={4}>
        <Form.Item label="รหัสไปรษณีย์" name="zipcode">
          <InputThaiAddress.Zipcode
            onSelect={handleSelect}
            style={{ height: 40 }}
            autoCompleteProps={{ placeholder: "กรอกรหัสไปรษณีย์" }}
          />
        </Form.Item>
      </Col>
    </Row>
  );


  const ContactDetail = () => (
    <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={6}>
        <Form.Item label="ติดต่อ" name="contact">
          <Input placeholder="กรอกสื่อการติดต่อ" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={6}>
        <Form.Item label="อีเมล" name="email">
          <Input placeholder="กรอกอีเมล" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={6}>
        <Form.Item label="เบอร์โทรศัพท์" name="tel">
          <Input placeholder="กรอกเบอร์โทรศัพท์" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={6}>
        <Form.Item label="เบอร์แฟ็ค" name="fax">
          <Input placeholder="กรอกเบอร์แฟ็ค" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Form.Item label="หมายเหตุ" name="remark">
          <Input.TextArea placeholder="กรอกหมายเหตุ" rows={4} />
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
    <div className="supplier-manage xs:px-0 sm:px-0 md:px-8 lg:px-8">
      <Space direction="vertical" className="flex gap-2">
        <Form form={form} layout="vertical" autoComplete="off">
          <Card title={config?.title}>
            <Divider
              orientation="left"
              plain
              style={{ margin: 10, fontSize: 20, border: 20 }}
            >
              รายละเอียดข้อมูล
            </Divider>
            <Detail />

            <Divider
              orientation="left"
              plain
              style={{ margin: 10, fontSize: 20, border: 20 }}
            >
              ที่อยู่
            </Divider>
            <AddressDetail />


            <Divider
              orientation="left"
              plain
              style={{ margin: 10, fontSize: 20, border: 20 }}
            >
              การติดต่อ
            </Divider>
            <ContactDetail />
          </Card>
        </Form>
        {SectionBottom}
      </Space>
    </div>
  );
};

export default MyManage;
