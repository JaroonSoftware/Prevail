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

import { quotationForm, DEFALUT_CHECK_STEP_FORM } from "./model";

import MyManageForm from "./MyManageForm";
import StepPanel from "../../components/step/StepPanel";
import FormCustomer from "../../components/form/customer/FormCustomer";

import dayjs from "dayjs";
import { delay } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";

import { LuPrinter, LuPackagePlus } from "react-icons/lu";
import { SolutionOutlined, FileAddOutlined } from "@ant-design/icons";

const opservice = OptionService();
const qtservice = QuotationService();

const gotoFrom = "/quotation";

const formName = "quo";

function QuotationManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };

  const [form] = Form.useForm();

  const [formValue, setformValue] = useState(quotationForm);
  const [checkStep, setCheckStep] = useState(DEFALUT_CHECK_STEP_FORM);

  /** Quotation state */
  const [quotCode, setQuotCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(quotationForm);

  const [step_number, setStep_number] = useState(0);

  useEffect(() => {
    // alert(config?.action);
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
      }
    };

    initial();
    return () => {};
  }, []);

  const handleNextStep = (values) => {
    // console.log(values);

    // console.log(checkStep);
    setCheckStep((prev) => ({ ...prev, ...values }));
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
      content: (
        <MyManageForm
          formName={formName}
          submit={handleConfirm}
          initeial={checkStep}
          step_number={step_number}
          config={config}
          formData={(data) => setFormDetail(data)}
          listData={(data) => setListDetail(data)}
        />
      ),
    },
  ];

  return (
    <div className="quotation-manage">
      {config.action === "edit" ? (
        <MyManageForm
          formName={formName}
          submit={handleConfirm}
          initeial={formValue}
          step_number={step_number}
          config={config}
          formData={(data) => setFormDetail(data)}
          listData={(data) => setListDetail(data)}
        />
      ) : (
        <StepPanel
          dataStep={checkStep}
          steps={steps}
          step_number={(step_number) => setStep_number(step_number)}
          formName={formName}
          submit={handleConfirm}
          backtohome={gotoFrom}
        />
        
      )}
    </div>
  );
}

export default QuotationManage;
