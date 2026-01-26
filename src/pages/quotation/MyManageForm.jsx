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
  Card,
  DatePicker,
  Typography,
  Table
} from "antd";
import { useState, useEffect } from "react";
import OptionService from "../../service/Options.service";
import QuotationService from "../../service/Quotation.service";
import dayjs from "dayjs";

// import { columnsdetail } from "./model";
import { LuPrinter, LuPackagePlus } from "react-icons/lu";
import { quotationForm,columnsParametersEditable,componentsEditable } from "./model";
import { ButtonBack } from "../../components/button";

import { delay } from "../../utils/util";
import { SaveFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { RiDeleteBin5Line } from "react-icons/ri";

const opService = OptionService();
const qtservice = QuotationService();

const dateFormat = "DD/MM/YYYY";

const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

export default function ItemsManageForm({
  formName = "form-name",
  submit,
  initeial,
  step_number,
  config,
  formData,
  listData
}) {
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const formRole = { required: true, message: "กรุณากรอกข้อมูลให้ครบถ้วน!" };
  const [optionType, setOptionType] = useState([]);

  // const [openCustomer, setOpenCustomer] = useState(false);

  /** Quotation state */
    const [quotCode, setQuotCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);
  const [formDetail, setFormDetail] = useState(quotationForm);

  const [unitOption, setUnitOption] = useState([]);
  const [stcodeOption, setStcodeOption] = useState([]);

  const gotoFrom = "/quotation";


  useEffect(() => {
    const initial = async () => {
          if (config?.action !== "create") {
            const res = await qtservice
              .get(config?.code)
              .catch((error) => message.error("get Quotation data fail."));
            const {
              data: { header, detail },
            } = res.data;
            const { qtcode, qtdate } = header;
            setFormDetail(header);
            setListDetail(detail.map((d, i) => ({ ...d, _rid: i + 1 })));
            // setQuotBanks( bank );
            setQuotCode(qtcode);
            form.setFieldsValue({ ...header, qtdate: dayjs(qtdate) });
            // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
            // handleChoosedCustomer(head);
          } else {
            const { data: code } = (
              await qtservice.code().catch((e) => {
                message.error("get Quotation code fail.");
              })
            ).data;
            // console.log("code", initeial);
            setQuotCode(code);
            form.setFieldValue("vat", 7);
            const ininteial_value = {
              ...initeial,
              qtcode: code,
              qtdate: dayjs(new Date()),
            };
            setFormDetail(ininteial_value);
            form.setFieldsValue(ininteial_value);
          }
          const [unitOprionRes] = await Promise.all([
            opService.optionsUnit({ p: "unit-option" }),
          ]);
          // console.log(unitOprionRes.data.data)
          setUnitOption(unitOprionRes.data.data);
        };
    
        initial();
        return () => {};
  }, [initeial, config, form]);

  useEffect(() => {
    // alert(step_number);
    if(step_number === 1){
      qtservice.getcatalog(form.getFieldValue("cuscode")).then((res) => {
        let { data } = res.data;
        setListDetail(data.map((d, i) => ({ ...d, _rid: i + 1 })));
      });
    }
    else{
      setListDetail([]);
    }
  }, [step_number]);

  useEffect(() => {
    listData(listDetail);
    formData(formDetail);
  }, [listDetail, formDetail]);

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
        const actions = config?.action !== "create" ? qtservice.update : qtservice.create;
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

  const handleQuotDate = (e) => {
      const { valid_price_until } = form.getFieldsValue();
      if (!!valid_price_until && !!e) {
        handleCalculatePrice(valid_price_until || 0, e || new Date());
      }
    };
  
    const handleDelete = (code) => {
      const itemDetail = [...listDetail];
      const newData = itemDetail.filter((item) => item?._rid !== code);
      setListDetail([...newData]);
    };
  
    const handleRemove = (record) => {
      const itemDetail = [...listDetail];
      return itemDetail.length >= 1 ? (
        <Button
          className="bt-icon"
          size="small"
          danger
          icon={
            <RiDeleteBin5Line style={{ fontSize: "1rem", marginTop: "3px" }} />
          }
          onClick={() => handleDelete(record?._rid)}
          disabled={!record?._rid}
        />
      ) : null;
    };
  
    const handleEditCell = (row) => {
      const newData = (r) => {
        const itemDetail = [...listDetail];
        const newData = [...itemDetail];
  
        const ind = newData.findIndex((item) => item._rid === r._rid);
        if (ind < 0) return itemDetail;
        const item = newData[ind];
        newData.splice(ind, 1, {
          ...item,
          ...row,
        });
  
        // handleSummaryPrice();
        return newData;
      };
      setListDetail([...newData(row)]);
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

  const handleCalculatePrice = (day, date) => {
    const newDateAfterAdding = dayjs(date || new Date()).add(
      Number(day),
      "day",
    );
    const nDateFormet = newDateAfterAdding.format("YYYY-MM-DD");

    setFormDetail((state) => ({ ...state, dated_price_until: nDateFormet }));
    form.setFieldValue("dated_price_until", nDateFormet);
  };

  
    /** setting column table */
  const prodcolumns = columnsParametersEditable(
    handleEditCell,
    unitOption,
    stcodeOption,
    {
      handleRemove,
    },
  );

  const SectionProduct = (
      <>
        <Flex className="width-100" vertical gap={4}>
          <Table
            title={() => TitleTable}
            components={componentsEditable}
            rowClassName={() => "editable-row"}
            bordered
            dataSource={listDetail}
            columns={prodcolumns}
            pagination={false}
            rowKey="_rid"
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: <span>No data available, please add some data.</span>,
            }}
          />
        </Flex>
      </>
    );
  
    const SectionOther = (
      <>
        <Space size="small" direction="vertical" className="flex gap-2">
          <Row gutter={[8, 8]} className="m-0">
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
              <Form.Item className="" name="remark" label="หมายเหตุ">
                <Input.TextArea placeholder="กรอกข้อมูลเพิ่มเติม" rows={4} />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      </>
    );

  const SectionCustomer = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cuscode" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input placeholder="ที่อยู่ลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="contact" label="ผู้ติดต่อ" className="!mb-1">
              <Input placeholder="ช่องทางการติดต่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="tel" label="เบอร์โทรลุกค้า" className="!mb-1">
              <Input placeholder="เบอร์โทรลุกค้า" readOnly />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการสินค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Flex justify="end">
            <Button
              icon={<LuPackagePlus style={{ fontSize: "1.2rem" }} />}
              className="bn-center justify-center bn-primary-outline"
              onClick={() => {
                setListDetail((state) => [
                  ...state,
                  {
                    _rid: state.length + 1,
                    stcode: "",
                    stname: "",
                    qty: 1,
                    price: 0,
                    unit: "",
                    discount: 0,
                    vat: 0,
                  },
                ]);
              }}
            >
              เพิ่มสินค้า
            </Button>
          </Flex>
        </Flex>
      </Col>
    </Flex>
  );

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

  const SectionBottom = (
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
    </Row>
  );

  return (
    <Space direction="vertical" className="w-full">
      {/* {SectionTop} */}
      <Form
        form={form}
        layout="vertical"
        name={formName}
        autoComplete="off"
        className="w-full"
        // onValuesChange={(_, value)=> setFormValue(value)}
        onFinish={onFinish}
      >
        <div id="quotation-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {config.action === "edit" && SectionTop}
          <Form
            form={form}
            layout="vertical"
            className="width-100"
            autoComplete="off"
          >
            <Card
              title={
                <>
                  <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Typography.Title level={3} className="m-0">
                        เลขที่ใบเสนอราคา : {quotCode}
                      </Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบเสนอราคา :{" "}
                        </Typography.Title>
                        <Form.Item name="qtdate" className="!m-0">
                          <DatePicker
                            className="input-40"
                            allowClear={false}
                            onChange={handleQuotDate}
                            format={dateFormat}
                          />
                        </Form.Item>
                      </Flex>
                    </Col>
                  </Row>
                </>
              }
            >
              <Row className="m-0" gutter={[12, 12]}>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    ลูกค้า
                  </Divider>
                  <Card style={cardStyle}>{SectionCustomer}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!my-0">
                    รายการสินค้าใบเสนอราคา
                  </Divider>
                  <Card style={{ backgroundColor: "#f0f0f0" }}>
                    {SectionProduct}
                  </Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    ข้อมูลเพิ่มเติม
                  </Divider>
                  <Card style={cardStyle}>{SectionOther}</Card>
                </Col>
              </Row>
            </Card>
          </Form>
          {config.action === "edit" && SectionBottom}
        </Space>
      </div>
      </Form>
    </Space>
  );
}
