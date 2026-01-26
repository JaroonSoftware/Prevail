import React, { useState } from "react";
import { Button, Steps, Flex, Col, Row, message } from "antd";
import { SaveFilled } from "@ant-design/icons";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { delay } from "../../utils/util";

export default function StepPanel({
  formName = "form-name",
  dataStep,
  steps,
  step_number,
  backtohome,
  submit,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  function next() {
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    step_number(nextStep);
  }

  function prev() {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    step_number(prevStep);
  }

  function Checknext() {
    if (activeStep === 0) {
      if (dataStep.cuscode !== null) next();
      else message.error("กรุณา เลือกลูกค้าก่อน.");
    }
  }

  async function Backtohome() {
    navigate(backtohome, { replace: true });
    await delay(300);
  }

  return (
    <>
      <div className="steps-action">
        <Row
          gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
          className="m-0"
        >
          <Col span={12} className="p-0">
            <Flex gap={4} justify="start">
              {activeStep > 0 && (
                <Button
                  style={{ width: 120 }}
                  icon={<ArrowLeftOutlined />}
                  onClick={() => prev()}
                >
                  ก่อนหน้า
                </Button>
              )}
              {activeStep === 0 && (
                <Button
                  style={{ width: 120 }}
                  icon={<ArrowLeftOutlined />}
                  onClick={() => Backtohome()}
                >
                  กลับสู่หน้าแรก
                </Button>
              )}
            </Flex>
          </Col>
          <Col span={12} style={{ paddingInline: 0 }}>
            <Flex gap={4} justify="end">
              {activeStep < steps.length - 1 && (
                <Button
                  type="primary"
                  style={{ width: 120 }}
                  icon={<ArrowRightOutlined />}
                  onClick={() => Checknext()}
                >
                  ถัดไป
                </Button>
              )}
              {activeStep === steps.length - 1 && (
                <Button
                  icon={<SaveFilled style={{ fontSize: "1rem" }} />}
                  className="bn-center bn-primary"
                  form={formName}
                  htmlType="submit"
                  onClick={() => {
                    submit();
                  }}
                >
                  ยืนยัน/บันทึก
                </Button>
              )}
            </Flex>
          </Col>
        </Row>
      </div>
      <br></br>
      <Flex gap={4} justify="center">
        <Steps style={{ width: "55%" }} current={activeStep}>
          {steps.map((item) => (
            <Steps.Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>
      </Flex>
      {steps.map((item) => (
        <div
          className={`steps-content ${
            item.step !== activeStep + 1 && "hidden"
          }`}
        >
          {item.content}
        </div>
      ))}
    </>
  );
}
