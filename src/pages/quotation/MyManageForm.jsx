import {
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Button,
  Badge,
  Flex,
  Modal,
  message,
} from "antd";
import { useState, useEffect } from "react";
import OptionService from "../../service/Options.service";
import QuotationService from "../../service/Quotation.service";
import dayjs from "dayjs";

// import { columnsdetail } from "./model";
import { LuPrinter, LuPackagePlus } from "react-icons/lu";
import { quotationForm } from "./model";
import { ButtonBack } from "../../components/button";

import { nocomma, delay } from "../../utils/util";
import { SaveFilled, SearchOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { ModalItems } from "../../components/modal/itemsbyCL/modal-items";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";

const opService = OptionService();
const qtservice = QuotationService();

export default function ItemsManageForm({
  formName = "form-name",
  submit,
  initeial,
  mode,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [form] = Form.useForm();
  const formRole = { required: true, message: "กรุณากรอกข้อมูลให้ครบถ้วน!" };
  const [optionType, setOptionType] = useState([]);
  // const [optionCategory, setOptionCategory] = useState([]);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);
  const [formDetail, setFormDetail] = useState(quotationForm);

  const gotoFrom = "/quotation";

  useEffect(() => {
    GetItemsType();
    // GetItemsCategory();
    if (mode !== "create") {
      const newIniteial = {
        ...initeial,
        price: nocomma(initeial?.price),
        price_A: nocomma(initeial?.price_A),
        price_B: nocomma(initeial?.price_B),
        price_online: nocomma(initeial?.price_online),
      };

      form.setFieldsValue(newIniteial);
    } else {
      form.setFieldsValue({
        typecode: "1",
      });
      // itemService
      //   .getcode("1")
      //   .then((res) => {
      //     let { data } = res;
      //     form.setFieldsValue({
      //       stcode: data,
      //     });
      //   })
      //   .catch((err) => {});
    }
  }, [initeial, mode, form]);

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  const dividerProp = {
    orientation: "left",
    style: { marginBlock: 10 },
    className: "!border-black",
  };

  const GetItemsType = () => {
    opService.optionsItemstype().then((res) => {
      let { data } = res.data;
      setOptionType(data);
    });
  };

  const handleConfirm = () => {
    let errormessage = "";

    form
      .validateFields()
      .then((v) => {
        if (listDetail.length < 1)
          throw (errormessage = "กรุณาเพิ่มรายการสินค้า");

        if (listDetail.some((ld) => !ld.stcode || ld.stcode === ""))
          throw (errormessage = "กรุณาเลือกสินค้าที่ต้องการขายให้ครบถ้วน");

        const header = {
          ...formDetail,
          qtdate: dayjs(form.getFieldValue("qtdate")).format("YYYY-MM-DD"),
          remark: form.getFieldValue("remark"),
        };
        const detail = listDetail;

        const parm = { header, detail };
        // console.log(parm)
        const actions = mode !== "create" ? qtservice.update : qtservice.create;
        actions(parm)
          .then((r) => {
            handleClose().then((r) => {
              message.success("Request Quotation success.");
            });
          })
          .catch((err) => {
            message.error("Request Quotation fail.");
            console.warn(err);
          });
      })
      .catch((err) => {
        if (errormessage === "")
          errormessage = "กรุณาเลือกลูกค้า ก่อนทำการบันทึกข้อมูล";
        Modal.error({
          title: "ข้อผิดพลาด",
          content: errormessage,
        });
      });
  };

  const Getstcode = () => {
    // itemService
    //   .getcode(form.getFieldValue("typecode"))
    //   .then((res) => {
    //     let { data } = res;
    //     form.setFieldsValue({
    //       stcode: data,
    //     });
    //   })
    //   .catch((err) => {});
  };

  const onFinish = (values) => {
    const itype = optionType?.find((f) => f.typecode === values?.typecode);

    const reponse = { ...values, categorycode: itype?.categorycode };

    // console.log(reponse);
    submit({ ...reponse });
  };

  const handleClose = async () => {
    navigate(gotoFrom, { replace: true });
    await delay(300);
    console.clear();
  };

  const handlePrint = () => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `/quo-print/${formDetail.quotcode}`;
  };
  const SectionTop = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={gotoFrom} />
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            className="bn-center justify-center"
            icon={<SaveFilled style={{ fontSize: "1rem" }} />}
            type="primary"
            style={{ width: "9.5rem" }}
            onClick={() => {
              handleConfirm();
            }}
          >
            Save
          </Button>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          {!!formDetail.quotcode && (
            <Button
              icon={<LuPrinter />}
              onClick={() => {
                handlePrint();
              }}
              className="bn-center !bg-orange-400 !text-white !border-transparent"
            >
              PRINT QUOTATION
            </Button>
          )}
        </Flex>
      </Col>
    </Row>
  );
  const info = (
    <>
      <Divider {...dividerProp}>ข้อมูลสินค้า</Divider>
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="ประเภทสินค้า" name="typecode">
            <Select
              size="large"
              showSearch
              filterOption={filterOption}
              placeholder="เลือกประเภทสินค้า"
              onChange={Getstcode}
              className="!bg-white"
              disabled
              options={optionType.map((item) => ({
                value: item.typecode,
                label: item.typename,
              }))}
            ></Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="รหัสสินค้า" name="stcode">
            <Input placeholder="กรอกรหัสสินค้า" readOnly />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item label="ชื่อสินค้า" name="stname" rules={[formRole]}>
            <Input placeholder="กรอกชื่อสินค้า" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item name="material_code" label="Material code">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stcode_vat" label="รหัสสินค้าคลัง VAT">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={6}>
          <Form.Item name="categorycode">
            <Input type="hidden" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
  const details_tab1 = (
    <>
      <Divider {...dividerProp}>รายละเอียดสินค้า</Divider>
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stname_vat" label="ชื่อเปิดบิล VAT">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="brand" label="ยี่ห้อ">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stname_per" label="ชื่อสินค้า/ดอก">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stfront" label="รุ่น1/หน้า">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stseries" label="รุ่น2/ซี่รี่ย์">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stborder" label="รุ่น3/ขอบ">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stload" label="รุ่น4/โหลด">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stspeed" label="รุ่น5/สปีด">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="sttw" label="รุ่น6/TW">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stweight" label="รุ่น7/น้ำหนัก">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stwidth" label="รุ่น8/กว้าง">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stlong" label="รุ่น9/ยาว">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="sthigh" label="รุ่น10/สูง">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stchange_round" label="รอบการเปลี่ยน">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stchange_time" label="เวลาในการเปลี่ยน">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="stcar_brand" label="ยี่ห้อรถ">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item name="stcar_model" label="รุ่นรถ">
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
  const other = (
    <>
      <Divider {...dividerProp}>เพิ่มเติม</Divider>
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item label="หมายเหตุ" name="remark">
            <Input.TextArea placeholder="กรอกข้อมูลเพิ่มเติม" rows={4} />
          </Form.Item>
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
          style={mode === "edit" ? { display: "inline" } : { display: "none" }}
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
    </>
  );
  const price = (
    <>
      <Divider {...dividerProp}>ราคา</Divider>
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="price" label="ราคาขายปลีก">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="price_A" label="Promotion">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="price_B" label="ราคาส่ง">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="price_online" label="ราคา Online">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="min" label="สต๊อกขั้นต่ำ (ชิ้น)">
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
  const stock = (
    <>
      <Divider {...dividerProp}>สต๊อก</Divider>
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col xs={24} sm={24} lg={24}>
          {/* { Number( initeial?.cat_stock_by_product || 0 ) === 0 && <FormStock selected={initeial}  /> }
          { Number( initeial?.cat_stock_by_product || 0 ) === 1 && <FormTireStock selected={initeial}  /> } */}
        </Col>
      </Row>
    </>
  );
  const tabdata = [
    {
      key: "ข้อมูลพิ้นฐาน",
      label: "ข้อมูลพิ้นฐาน",
      children: (
        <div>
          {info}
          {details_tab1}
          {other}
        </div>
      ),
    },
    {
      key: "ราคา",
      label: "ราคา",
      children: <div>{price}</div>,
    },
    {
      key: "สต๊อก",
      label: "สต๊อก",
      children: <div>{stock}</div>,
    },
  ];

  return (
    // <div id="quotation-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
    //     <Space direction="vertical" className="flex gap-4">
    //       {SectionTop}
    //       <Form
    //         form={form}
    //         layout="vertical"
    //         className="width-100"
    //         autoComplete="off"
    //       >
    //         <Card
    //           title={
    //             <>
    //               <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
    //                 <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
    //                   <Typography.Title level={3} className="m-0">
    //                     เลขที่ใบเสนอราคา : {quotCode}
    //                   </Typography.Title>
    //                 </Col>
    //                 <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
    //                   <Flex
    //                     gap={10}
    //                     align="center"
    //                     className="justify-start sm:justify-end"
    //                   >
    //                     <Typography.Title level={3} className="m-0">
    //                       วันที่ใบเสนอราคา :{" "}
    //                     </Typography.Title>
    //                     <Form.Item name="qtdate" className="!m-0">
    //                       <DatePicker
    //                         className="input-40"
    //                         allowClear={false}
    //                         onChange={handleQuotDate}
    //                         format={dateFormat}
    //                       />
    //                     </Form.Item>
    //                   </Flex>
    //                 </Col>
    //               </Row>
    //             </>
    //           }
    //         >
    //           <Row className="m-0" gutter={[12, 12]}>
    //             <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
    //               <Divider orientation="left" className="!mb-3 !mt-1">
    //                 ลูกค้า
    //               </Divider>
    //               <Card style={cardStyle}>{SectionCustomer}</Card>
    //             </Col>
    //             <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
    //               <Divider orientation="left" className="!my-0">
    //                 รายการสินค้าใบเสนอราคา
    //               </Divider>
    //               <Card style={{ backgroundColor: "#f0f0f0" }}>
    //                 {SectionProduct}
    //               </Card>
    //             </Col>
    //             <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
    //               <Divider orientation="left" className="!mb-3 !mt-1">
    //                 ข้อมูลเพิ่มเติม
    //               </Divider>
    //               <Card style={cardStyle}>{SectionOther}</Card>
    //             </Col>
    //           </Row>
    //         </Card>
    //       </Form>
    //       {SectionBottom}
    //     </Space>
    //   </div>

    //   {openCustomer && (
    //     <ModalCustomers
    //       show={openCustomer}
    //       close={() => setOpenCustomer(false)}
    //       values={(v) => {
    //         handleChoosedCustomer(v);
    //       }}
    //     ></ModalCustomers>
    //   )}

    //   {openProduct && (
    //     <ModalItems
    //       show={openProduct}
    //       close={() => setOpenProduct(false)}
    //       values={(v) => {
    //         handleItemsChoosed(v);
    //       }}
    //       cuscode={form.getFieldValue("cuscode")}
    //       selected={listDetail}
    //     ></ModalItems>
    //   )}
    <Space direction="vertical" className="w-full">
      {SectionTop}
      <Form
        form={form}
        layout="vertical"
        name={formName}
        autoComplete="off"
        className="w-full"
        // onValuesChange={(_, value)=> setFormValue(value)}
        onFinish={onFinish}
      >
        <Tabs type="card" defaultActiveKey="ข้อมูลพิ้นฐาน" items={tabdata} />
      </Form>
    </Space>
  );
}
