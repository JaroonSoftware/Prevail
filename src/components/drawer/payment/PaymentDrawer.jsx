import React, { useEffect, useState } from "react";
import {
  Divider,
  Row,
  Col,
  Form,
  Flex,
  Button,
  Input,
  InputNumber,
  Card,
  DatePicker,
  Table,
  Typography,
} from "antd";
import { notEnter, formatMoney } from "../../../utils/util";
import { SelectBanks, SelectPaymentMethods } from "../../select/index.js";
import ExpensePaymentService from "../../../service/Receipt.service";
import dayjs from "dayjs";
import { SaveFilled, ArrowLeftOutlined } from "@ant-design/icons";
import { reViewColumns } from "../../../pages/receipt/model";

const payrequest = ExpensePaymentService();
export default function DryCheckDrawer({
  data,
  submit,
  name = "form-data",
  close,
}) {
  const dividerProp = {
    orientation: "left",
    style: { marginBlock: 10 },
    className: "!border-black",
  };
  const formRole = { required: true, message: "กรุณากรอกข้อมูลให้ครบถ้วน!" };
  // const confirms = useConfirm();

  const [form] = Form.useForm();
  const [dataBank, setDataBank] = useState({});

  const paid_amount = Form.useWatch("paid_amount", form);
  const paid_withholding = Form.useWatch("withholding_discount_txt", form);

  const handleConfirm = () => {
    const dataSource = { 
      ...form.getFieldsValue(),
      bank_code: dataBank?.key || null, 
     };
    submit(dataSource);
  };

  useEffect(() => {
    const grand_total = (data || []).reduce((sum, r) => {
      const base = Number(r?.total_price || 0) - Number(r?.discount || 0);
      return sum + base;
    }, 0);
    const actual_payment =
      Number(paid_amount || 0) + Number(paid_withholding || 0);
    const remaining = grand_total - actual_payment;
    form.setFieldsValue({
      recode: data?.[0]?.recode || "",
      payment_total_txt: formatMoney(grand_total, 2, 2),
      actual_payment_txt: formatMoney(actual_payment, 2, 2),
      payment_remain_txt: formatMoney(remaining, 2, 2),
    });
    // setActualPayment(actual_payment);
  }, [paid_amount, paid_withholding, form, data]);

  const handleInitData = React.useCallback(async () => {
    try {
      // setDataHeader(data || {});
      const { blcode } = data || {};
      const payments =
        (await payrequest.get(blcode, { ignoreLoading: true })).data || {};
      const { amount_paid, withholding_tax, paydate } = payments.data;

      const computed_total = (Array.isArray(data) ? data : []).reduce(
        (sum, r) => {
          const base = Number(r?.total_price || 0) - Number(r?.discount || 0);
          return sum + base;
        },
        0
      );
      form.setFieldsValue({
        ...payments.data,
        payment_total_txt: formatMoney(computed_total, 2, 2),
        paid_amount: Number(computed_total || 0),
        amount_paid: Number(amount_paid || 0),
        withholding_tax: Number(withholding_tax || 0),
        actual_payment_txt: formatMoney(
          Number(amount_paid || 0) - Number(withholding_tax || 0),
          2,
          2
        ),
        payment_remain_txt: formatMoney(
          computed_total - Number(amount_paid || 0),
          2,
          2
        ),
        paydate: !!paydate ? dayjs(paydate) : dayjs(),
      });

      // setDataPayment(payments.data || {});
    } catch (e) {
      console.log(e);
      // message.error(handleSetMessage(e?.message));
    }
  }, [form]);

  React.useEffect(() => {
    // console.log( "openDrawer" );
    handleInitData();
  }, [handleInitData]);

  const fields_payment = (
    <>
      <Row
        gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
        className="m-0"
      >
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="เลขที่ใบเสร็จรับเงิน" name="recode">
            <Input className="input-40 !text-black" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="ยอดที่ต้องชำระทั้งหมด" name="payment_total_txt">
            <Input className="input-40 !text-black" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="ยอดชำระ" name="paid_amount">
            <InputNumber
              className="w-full input-40"
              controls={false}
              placeholder="กรอก ยอดชำระ"
              min={0}
              onFocus={(e) => e.target.select()}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="คงเหลือ" name="payment_remain_txt">
            <Input className="input-40 !text-black" disabled />
          </Form.Item>
        </Col>
        {/* <Col xs={24} sm={12} lg={6}>
          <Form.Item
            label="ส่วนลด/หักค่าใช้จ่าย"
            name="withholding_discount_txt"
          >
            <Input className="input-40 !text-black" disabled />
          </Form.Item>
        </Col> */}
      </Row>
    </>
  );

  const fields_discount = (
    <>
      <Row
        gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
        className="m-0"
      >
        <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
          <Form.Item
            label="วันที่ชำระ"
            name="paydate"
            rules={[
              formRole,
              {
                type: "object",
                date_max: dayjs(),
                message: "กรุณาเลือกวันที่ชำระ",
              },
            ]}
          >
            <DatePicker
              style={{ width: "100%", height: 40 }}
              format="DD/MM/YYYY"
              placeholder="กำหนดวันที่ชำระ"
              maxDate={dayjs()}
              className="!text-black"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
          <Form.Item label="รูปแบบการชำระเงิน" name="payment_type">
            <SelectPaymentMethods
              className="!text-black"
              // disabled={action === "view"}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
          <Form.Item label="ธนาคาร" name="bank_name">
            {/* <Input placeholder="กรอก ธนาคาร" className="input-40" /> */}
            <SelectBanks
              keyValue="thai_name"
              className="!text-black"
              // disabled={action === "view"}
              onChange={(_, rec) => {
                setDataBank(rec);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={6} xxl={6}>
          <Form.Item label="เลขที่เช็ค/อ้างอิง" name="reference_no">
            <Input placeholder="กรอก เลขที่เช็ค/อ้างอิง" className="input-40" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={6} xxl={6}>
          <Form.Item label="สาขา" name="branch">
            <Input placeholder="กรอก สาขา" className="input-40" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24}>
          <Form.Item label="หมายเหตุ" name="remark">
            <Input.TextArea rows={2}></Input.TextArea>
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const field_infomation = (
    <>
      <Card
        style={{ backgroundColor: "#f3f4f6" }}
        id="billing-payment-head-list"
      >
        <Table
          style={{ backgroundColor: "#fafafa" }}
          dataSource={data}
          columns={reViewColumns}
          pagination={false}
          rowKey={(r) => r?.stcode ?? r?.id ?? r?.key ?? r?.seq}
          scroll={{ x: "max-content" }}
          size="small"
          summary={(pageData) => {
            const totalNet = (pageData || []).reduce((sum, r) => {
              const base =
                Number(r?.total_price || 0) - Number(r?.discount || 0);
              return sum + base;
            }, 0);

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="end" className="!pe-2">
                  Grand Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right" className="!pe-2">
                  <Typography.Text type="danger">
                    {formatMoney(totalNet, 2)}
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </>
  );

  const information = (
    <>
      <br />
      <Divider {...dividerProp}></Divider>
      <br />
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col span={12} className="p-0">
          <Flex gap={4} justify="start">
            <Button
              className="bn-center justify-center"
              style={{ width: 120 }}
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                close();
              }}
            >
              กลับ
            </Button>
          </Flex>
        </Col>
        <Col span={12} className="p-0">
          <Flex gap={4} justify="end">
            <Button
              className="bn-center justify-center"
              icon={<SaveFilled style={{ fontSize: "1rem" }} />}
              type="primary"
              style={{ width: "9.5rem", marginLeft: "10px" }}
              onClick={() => {
                handleConfirm();
              }}
            >
              ยืนยันการสั่งซื้อ
            </Button>
          </Flex>
        </Col>
      </Row>
    </>
  );

  return (
    <>
      <Form
        id="form-product-expiry"
        form={form}
        layout="vertical"
        name={name}
        autoComplete="off"
        className="w-full"
        // onValuesChange={(_, value)=> setFormValue(value)}
        onKeyDown={notEnter}
        // onFinish={onSubmit}
      >
        <Divider {...dividerProp}>ข้อมูลรายการ</Divider>
        {field_infomation}

        <Divider {...dividerProp}>ข้อมูลการชำระ</Divider>
        {fields_payment}

        {/* <Divider {...dividerProp}>ข้อมูลส่วนลด/หักค่าใช้จ่าย</Divider> */}
        <Divider {...dividerProp}>ข้อมูลอื่นๆ</Divider>
        {fields_discount}
        {/* {fields_payment}  */}

        {information}
      </Form>
    </>
  );
}
