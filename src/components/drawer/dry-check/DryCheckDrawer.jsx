import { useEffect } from "react";
import {
  Divider,
  Row,
  Col,
  Form,
  Flex,
  Button,
  Descriptions,
} from "antd";
import { notEnter } from "../../../utils/util";

import dayjs from "dayjs";
import { SaveFilled, ArrowLeftOutlined } from "@ant-design/icons";

export default function PaymentDrawer({
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

  // const confirms = useConfirm();

  const [form] = Form.useForm();


  useEffect(() => {
    const init = () => {
      // console.log("data dry check drawer:", data);
      form.setFieldsValue(data);
    };

    init();
    return () => {};
  }, [data, form]);

  const handleConfirm = () => {
    submit(data);
    
  };

  const masterItems = [
    { label: "เลขที่ใบขายสินค้า", children: data?.socode || "" },
    {
      label: "วันที่ใบขายสินค้า",
      children: data?.sodate ? dayjs(data.sodate).format("DD/MM/YYYY") : "",
    },

    { label: "รหัสสินค้า", children: data?.stcode },
    {
      label: "ชื่อสินค้า",
      children: data?.stname,
      span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
    },
    {
      label: "จำนวนที่ต้องซื้อ",
      children: data?.qty_result,
    },
    {
      label: "จำนวนที่ลูกค้าสั่ง",
      children: data?.qty,
    },
    {
      label: "จำนวนในสต๊อก",
      children: data?.qty_stock,
    },
    {
      label: "จำนวนที่จอง",
      children: data?.qty_book,
    },
    {
      label: "หน่วยสินค้า",
      children: data?.unit || "",
    },
    { label: "รหัสลูกค้า", children: data?.cuscode || "" },
    {
      label: "ชื่อลูกค้า",
      children: data?.cusname || "",
      span: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 },
    },
    {
      label: "วันที่นัดส่งสินค้า",
      children: data?.deldate ? dayjs(data.deldate).format("DD/MM/YYYY") : "",
    },
    {
      label: "หมายเหตุ",
      labelStyle: { verticalAlign: "top" },
      children: <pre style={{ margin: 0 }}>{data?.remark || ""}</pre>,
      span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
    },
  ];

  const receipt_info = (
    <>
      <Divider {...dividerProp}>ข้อมูลรายการขายสินค้า</Divider>
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        items={masterItems}
      />
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
        {receipt_info}
        {information}
        {/*{list_receipt} */}
      </Form>
    </>
  );
}
