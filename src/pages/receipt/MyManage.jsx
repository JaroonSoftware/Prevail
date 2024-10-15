/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Typography,
  message,
} from "antd";
import { Card, Col, Divider, Flex, Row, Space, Table, InputNumber } from "antd";

import OptionService from "../../service/Options.service";
import ReceiptService from "../../service/Receipt.service";
import InvoiceService from "../../service/Invoice.service";
import {
  SaveFilled,
  SearchOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import ModalInvoice from "../../components/modal/invoice/MyModal";
import ModalPayment from "../../components/modal/payment/MyModal";

import {
  DEFALUT_CHECK_RECEIPT,
  componentsEditable,
  columnsParametersEditable,
} from "./model";

import dayjs from "dayjs";
import { delay, formatMoney } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";

import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPrinter } from "react-icons/lu";
import { LuPackageSearch } from "react-icons/lu";
const opservice = OptionService();
const reservice = ReceiptService();
const ivservice = InvoiceService();

const gotoFrom = "/receipt";
const dateFormat = "DD/MM/YYYY";

function ReceiptManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openBalance, setOpenBalance] = useState(0);
  
  /** Receipt state */
  const [reCode, setRECode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);
  const [listPayment, setListPayment] = useState([]);
  
  const [unitOption, setUnitOption] = useState([]);

  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_RECEIPT);

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await reservice
          .get(config?.code)
          .catch((error) => message.error("get Receipt data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { recode, redate } = header;
        setFormDetail(header);
        setListDetail(detail);
        setRECode(recode);
        form.setFieldsValue({
          ...header,
          redate: dayjs(redate),
        });

        // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
        // handleChoosedCustomers(head);
      } else {
        const { data: code } = (
          await reservice.code().catch((e) => {
            message.error("get Receipt code fail.");
          })
        ).data;
        setRECode(code);

        const ininteial_value = {
          ...formDetail,
          recode: code,
          redate: dayjs(new Date()),
          check_date: dayjs(new Date()),
        };

        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
        form.setFieldValue("vat", 7);
        form.setFieldValue("payment_method", "ชำระทั้งหมด");
        form.setFieldValue("payment_type", "เช็คธนาคาร");

        const [unitOprionRes] = await Promise.all([
          opservice.optionsUnit({ p: "unit-option" }),
        ]);
        // console.log(unitOprionRes.data.data)
        setUnitOption(unitOprionRes.data.data);
      }
    };

    initial();
    return () => {};
  }, []);

  useEffect(() => {
    if (listDetail) handleSummaryPrice();
  }, [listDetail]);

  const handleSummaryPrice = () => {
    const newData = [...listDetail];

    const total_price = newData.reduce(
      (a, v) =>
        a +=
          Number(v.qty || 0) *
          Number(v?.price || 0) *
          (1 - Number(v?.discount || 0) / 100)+(Number(v.qty || 0) *
          Number(v?.price || 0) *
          (1 - Number(v?.discount || 0) / 100)*(v.vat/100)),
      0
    );

    setFormDetail(() => ({
      ...formDetail,
      total_price,
    }));
    // console.log(formDetail)
  };

  const handleCalculatePrice = (day, date) => {
    const newDateAfterAdding = dayjs(date || new Date()).add(
      Number(day),
      "day"
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
  const handleChoosedCustomers = (val) => {
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
    const customers = {
      ...val,
      ivcode: "",
      cusname: cusname.join(""),
      address: addr.join(""),
      contact: val.contact,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customers }));
    form.setFieldsValue({ ...fvalue, ...customers });
    setListDetail([]);
  };
  
  const handleChoosedInvoice = async (val) => {

    const res = await ivservice.getlist(val);
    const {
      data: { header, detail },
    } = res.data;
    setListDetail(detail);
    handleSummaryPrice();
    // console.log(header.balance)
    setOpenBalance(header.balance);

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
    const quotation = {
      ...val,
      cusname: cusname.join(""),
      address: addr.join(""),
      contact: val.contact,
      price: header.balance,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    setFormDetail((state) => ({ ...state, ...quotation }));
    form.setFieldsValue({ ...fvalue, ...quotation });
  };

  const handleChoosedPayment = async (val) => {
    console.log(val)
  };

  const handleConfirm = () => {
    form
      .validateFields()
      .then((v) => {
        const header = {
          ...formDetail,
          recode: reCode,
          redate: dayjs(form.getFieldValue("redate")).format("YYYY-MM-DD"),
          remark: form.getFieldValue("remark"),
          total_price:formDetail.total_price,
        };

        // console.log(formDetail)
        const detail = listDetail;

        const parm = { header,detail };
        // console.log(parm)
        const actions =
          config?.action !== "create" ? reservice.update : reservice.create;
        actions(parm)
          .then((r) => {
            handleClose().then((r) => {
              message.success("Request Receipt success.");
            });
          })
          .catch((err) => {
            message.error("Request Receipt fail.");
            console.warn(err);
          });
      })
      .catch((err) => {
        Modal.error({
          title: "This is an error message",
          content: "Please enter require data",
        });
      });
  };

  const handleClose = async () => {
    navigate(gotoFrom, { replace: true });
    await delay(300);
    // console.clear();
  };

  const handlePrint = () => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = `/receipt/${formDetail.recode}`;
  };

  const handleDelete = (ivcode) => {
    const itemDetail = [...listDetail];
    const newData = itemDetail.filter((item) => item?.ivcode !== ivcode);
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
        onClick={() => handleDelete(record?.ivcode)}
        disabled={!record?.ivcode}
      />
    ) : null;
  };

  const handleEditCell = (row) => {
    const newData = (r) => {
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      const ind = newData.findIndex((item) => r?.stcode === item?.stcode);
      if (ind < 0) return itemDetail;
      const item = newData[ind];
      newData.splice(ind, 1, {
        ...item,
        ...row,
      });

      handleSummaryPrice();
      return newData;
    };
    setListDetail([...newData(row)]);
  };

  /** setting column table */
  const prodcolumns = columnsParametersEditable(handleEditCell, unitOption, {
    handleRemove,
  });

  const SectionCustomers = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
              rules={[{ required: true, message: "Missing Customer" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือกลูกค้า"
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
                    onClick={() => setOpenCustomers(true)}
                    style={{ minWidth: 40 }}
                  ></Button>
                )}
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={18} lg={18}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]} className="m-0">
          <Col
            xs={24}
            sm={24}
            md={6}
            lg={6}
            // style={
            //   config.action === "edit"
            //     ? { display: "inline" }
            //     : { display: "none" }
            // }
          >
            <Form.Item
              name="price"
              label={"( ยอดคงเหลือ " + formatMoney(openBalance, 2, 2) + " บาท)"}
              // className="!mb-1"
            >
              <InputNumber
                className="width-100 input-30 text-end"
                style={{ height: 40 }}
                placeholder="ยอดเงินทั้งหมด"
                disabled
              />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  const SectionPayment = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTablePayment}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listPayment}
          columns={prodcolumns}
          pagination={false}
          rowKey="ivcode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
        />
      </Flex>
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
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenInvoice(true);
            }}
          >
            Choose Invoice
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  const TitleTablePayment = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการชำระเงิน
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Button
            icon={<CreditCardOutlined style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenPayment(true);
            }}
          >
            Add Payment
          </Button>
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
          rowKey="stcode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          summary={(record) => {
            return (
              <>
                {listDetail.length > 0 && (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={8}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        Grand Total
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {formatMoney(Number(formDetail?.total_price || 0), 2)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell className="!pe-4 text-end">
                        Baht
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              </>
            );
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
              <Input.TextArea placeholder="Enter Remark" rows={4} />
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
          {!!formDetail.ivcod && (
            <Button
              icon={<LuPrinter />}
              onClick={() => {
                handlePrint();
              }}
              className="bn-center !bg-orange-400 !text-white !border-transparent"
            >
              PRINT QUOTATION{" "}
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
    <div className="goodsreceipt-manage">
      <div id="goodsreceipt-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {SectionTop}
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
                        เลขที่ใบเสร็จรับเงิน : {reCode}
                      </Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบเสร็จรับเงิน :{" "}
                        </Typography.Title>
                        <Form.Item name="redate" className="!m-0">
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
                    {" "}
                    ข้อมูลใบเสร็จรับเงิน{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionCustomers}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    รายการใบเสร็จรับเงิน
                  </Divider>
                  <Card style={cardStyle}>{SectionProduct}</Card>
                </Col>
                <Col
                  xs={24}
                  sm={24}
                  md={24}
                  lg={24}
                  xl={24}
                  xxl={24}
                  style={
                    config.action === "edit"
                      ? { display: "inline" }
                      : { display: "none" }
                  }
                >
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    {" "}
                    บันทึกการชำระเงิน{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionPayment}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    {" "}
                    ข้อมูลเพิ่มเติม{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionOther}</Card>
                </Col>
              </Row>
            </Card>
          </Form>
          {SectionBottom}
        </Space>
      </div>

      {openCustomers && (
        <ModalCustomers
          show={openCustomers}
          close={() => setOpenCustomers(false)}
          values={(v) => {
            handleChoosedCustomers(v);
          }}
        ></ModalCustomers>
      )}

      {openInvoice && (
        <ModalInvoice
          show={openInvoice}
          close={() => setOpenInvoice(false)}
          values={(v) => {
            handleChoosedInvoice(v);
          }}
          selected={listDetail}
        ></ModalInvoice>
      )}

    {openPayment && (
        <ModalPayment
          show={openPayment}
          close={() => setOpenPayment(false)}
          values={(v) => {
            handleChoosedPayment(v);
          }}
          selected={listDetail}
        ></ModalPayment>
      )}
    </div>
  );
}

export default ReceiptManage;
