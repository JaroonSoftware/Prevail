/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Table,
  Typography,
  message,
} from "antd";
import { Card, Col, Divider, Flex, Row, Space } from "antd";

import OptionService from "../../service/Options.service";
import QuotationService from "../../service/Quotation.service";
import { SaveFilled, SearchOutlined } from "@ant-design/icons";

import {
  quotationForm,
  columnsParametersEditable,
  componentsEditable,
  DEFALUT_CHECK_STEP_FORM
} from "./model";

import MyManageForm from "./MyManageForm";
import StepPanel from "../../components/step/StepPanel";
import FormCustomer from "../../components/form/customer/FormCustomer";

import dayjs from "dayjs";
import { delay } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";

import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPrinter, LuPackagePlus } from "react-icons/lu";
import { SolutionOutlined, FileAddOutlined } from "@ant-design/icons";

const opservice = OptionService();
const qtservice = QuotationService();

const gotoFrom = "/quotation";
const dateFormat = "DD/MM/YYYY";

const formName = "quo";

function QuotationManage() {
  const navigate = useNavigate();
  const location = useLocation();

   const {
    config: { mode, config},
  } = location.state || { config: null };

  const [form] = Form.useForm();

  const [formValue, setformValue] = useState(quotationForm);
  const [checkStep, setCheckStep] = useState(DEFALUT_CHECK_STEP_FORM);

  /** Modal handle */
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);

  /** Quotation state */
  const [quotCode, setQuotCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(quotationForm);

  const [unitOption, setUnitOption] = useState([]);
  const [stcodeOption, setStcodeOption] = useState([]);

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

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
        getstcodeList(header?.cuscode);
        // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
        // handleChoosedCustomer(head);
      } else {
        setListDetail([
          {
            _rid: 1,
            stcode: "",
            stname: "",
            qty: 1,
            price: 0,
            unit: "",
            discount: 0,
            vat: 0,
          },
        ]);
        const { data: code } = (
          await qtservice.code().catch((e) => {
            message.error("get Quotation code fail.");
          })
        ).data;
        setQuotCode(code);
        form.setFieldValue("vat", 7);
        const ininteial_value = {
          ...formDetail,
          qtcode: code,
          qtdate: dayjs(new Date()),
        };
        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
        getstcodeList("");
      }
      const [unitOprionRes] = await Promise.all([
        opservice.optionsUnit({ p: "unit-option" }),
      ]);
      // console.log(unitOprionRes.data.data)
      setUnitOption(unitOprionRes.data.data);
    };

    initial();
    return () => {};
  }, []);

  const handleNextStep = (values) => {
    // console.log(values);

    // console.log(checkStep);
    setCheckStep((prev) => ({ ...prev, ...values }));
  };

  const getstcodeList = async (cuscode = "") => {
    const [stcodeOptionRes] = await Promise.all([
      opservice.optionsItems({ p: "cl", cuscode: cuscode }),
    ]);
    setStcodeOption(stcodeOptionRes.data.data); // TO DO get stcode option
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

  const handleQuotDate = (e) => {
    const { valid_price_until } = form.getFieldsValue();
    if (!!valid_price_until && !!e) {
      handleCalculatePrice(valid_price_until || 0, e || new Date());
    }
  };

  /** Function modal handle */
  const handleChoosedCustomer = (val) => {
    // console.log(val)
    const fvalue = form.getFieldsValue();
    const addr = [
      !!val?.idno ? `${val.idno} ` : "",
      !!val?.road ? `${val?.road} ` : "",
      !!val?.subdistrict ? `${val.subdistrict} ` : "",
      !!val?.district ? `${val.district} ` : "",
      !!val?.province ? `${val.province} ` : "",
      !!val?.zipcode ? `${val.zipcode} ` : "",
      !!val?.country ? `(${val.country})` : "",
    ];
    const cusname = [
      !!val?.prename ? `${val.prename} ` : "",
      !!val?.cusname ? `${val.cusname} ` : "",
    ];
    const customer = {
      ...val,
      cusname: cusname.join(""),
      address: addr.join(""),
      contact: val.contact,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customer }));
    form.setFieldsValue({ ...fvalue, ...customer });
    getstcodeList(val?.cuscode);
  };

  const handleItemsChoosed = (value) => {
    setListDetail(value);
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
        const actions =
          config?.action !== "create" ? qtservice.update : qtservice.create;
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

  const handleClose = async () => {
    navigate(gotoFrom, { replace: true });
    await delay(300);
    console.clear();
  };

  const handlePrint = () => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `/quo-print/${formDetail.quotcode}`;
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

  /** setting column table */
  const prodcolumns = columnsParametersEditable(
    handleEditCell,
    unitOption,
    stcodeOption,
    {
      handleRemove,
    },
  );

  const SectionCustomer = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
              rules={[{ required: true, message: "Missing Loading type" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือก ลูกค้า"
                  id="cuscode-1"
                  value={formDetail.cuscode}
                  className="!bg-white"
                />
                {config?.action !== "create" ? (
                  ""
                ) : (
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => setOpenCustomer(true)}
                    style={{ minWidth: 40 }}
                  ></Button>
                )}
              </Space.Compact>
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

  ///** button */

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

  const steps = [
    {
      step: 1,
      title: "เลือกลูกค้า",
      icon: <SolutionOutlined />,
      content: <FormCustomer onChooseCustomer={handleNextStep} />,
    },
    {
      step: 2,
      icon: <FileAddOutlined />,
      title: "สร้างใบเสนอราคา",
      content: <MyManageForm
          formName={formName}
          submit={handleConfirm}
          initeial={formValue}
          mode={mode}
        />,
    },
  ];

  return (
    <div className="quotation-manage">
      {mode === "edit" ? (
        <MyManageForm
          formName={formName}
          submit={handleConfirm}
          initeial={formValue}
          mode={mode}
        />
      ) : (
        <StepPanel
          dataStep={checkStep}
          steps={steps}
          formName={formName}
          submit={handleConfirm}
        />
      )}
    </div>
  );
}

export default QuotationManage;
