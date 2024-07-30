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
import {
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Space,
  Select,
  Table,
  InputNumber,
} from "antd";

import OptionService from "../../service/Options.service";
import ReceiptService from "../../service/Receipt.service";
import InvoiceService from "../../service/Invoice.service";
import { SaveFilled, SearchOutlined } from "@ant-design/icons";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import ModalInvoice from "../../components/modal/invoice/MyModal";
import { ModalItems } from "../../components/modal/items/modal-items";
import { ModalBanks } from "../../components/modal/banks/modal-banks";

import {
  DEFALUT_CHECK_RECEIPT,
  componentsEditable,
  columnsParametersEditable,
} from "./model";

import dayjs from "dayjs";
import { delay, comma } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";

import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPrinter } from "react-icons/lu";
const opservice = OptionService();
const reservice = ReceiptService();
const ivservice = InvoiceService();

const gotoFrom = "/receipt";
const dateFormat = 'DD/MM/YYYY';

function ReceiptManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openPayAmount, setOpenPayAmount] = useState(false);
  const [openBalance, setOpenBalance] = useState(0);
  const [openBanks, setOpenBanks] = useState(false);

  /** Receipt state */
  const [reCode, setRECode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [unitOption, setUnitOption] = useState([]);
  const [banksOption, setBanksOption] = useState([]);
  const [banksOptionData, setBanksOptionDate] = useState([]);

  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_RECEIPT);

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      const [lbanksRes] = await Promise.all([opservice.optionsBanks()]);
        const { data: banksOptionData } = lbanksRes.data;

        const opnLtd = banksOptionData.map((v) => ({
          value: v.key,
          label: (
            <>
              <Flex align="center" gap={8}>
                <i
                  className={`bank bank-${v.key} shadow huge`}
                  style={{ height: 30, width: 30 }}
                ></i>
                <Flex align="start" gap={1} vertical>
                  <Typography.Text ellipsis style={{ fontSize: 13 }}>{v.thai_name}</Typography.Text> 
                  {/* <Typography.Text
                    ellipsis={true}
                    style={{ fontSize: 11, color: "#8c8386" }}
                  >
                    {v.official_name}
                  </Typography.Text> */}
                </Flex>
              </Flex>
            </>
          ),
          record: v,
        }));
        setBanksOption(opnLtd);
        setBanksOptionDate(banksOptionData);

      if (config?.action !== "create") {
        const res = await reservice
          .get(config?.code)
          .catch((error) => message.error("get Receipt data fail."));
        const {
          data: { header },
        } = res.data;
        const { recode, redate, check_date } = header;
        setFormDetail(header);
        setRECode(recode);
        form.setFieldsValue({
          ...header,
          redate: dayjs(redate),
          check_date: dayjs(check_date),
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
        (a +=
          Number(v.qty || 0) *
          Number(v?.price || 0) *
          (1 - Number(v?.discount || 0) / 100)),
      0
    );
    const vat = form.getFieldValue("vat");
    const grand_total_price =
      total_price + (total_price * form.getFieldValue("vat")) / 100;

    setFormDetail(() => ({
      ...formDetail,
      total_price,
      vat,
      grand_total_price,
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
    const res = await ivservice.get(val.ivcode);
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

  const handleItemsChoosed = (value) => {
    // console.log(value);
    setListDetail(value);
    handleSummaryPrice();
  };

  const handleConfirm = () => {
    form
      .validateFields()
      .then((v) => {
        
        const bnk = banksOptionData.find(
          (d) => d.key === form.getFieldValue("bank")
        );
        // if (!bnk) {
        //   message.error("Bank data error please choose bank");
        //   throw new Error("Bank Data is not empty.");
        // }

        const header = {
          ...formDetail,
          recode: reCode,
          redate: dayjs(form.getFieldValue("redate")).format("YYYY-MM-DD"),
          payment_type: form.getFieldValue("payment_type"),
          remark: form.getFieldValue("remark"),
          check_date: dayjs(form.getFieldValue("check_date")).format("YYYY-MM-DD"),          
          payment: form.getFieldValue("payment"),
          price: form.getFieldValue("price"),
          bank: form.getFieldValue("bank"),
          branch: form.getFieldValue("branch"),
          check_no: form.getFieldValue("check_no"),  
          check_amount: form.getFieldValue("check_amount"),  
          thai_name: bnk?.thai_name,
          balance: openBalance,
        };

        // console.log(formDetail)

        const parm = { header };
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

  const handleChoosedBanks = (val) => {
    console.log(val);
    // setQuotBanks(val);
    setFormDetail((state) => ({ ...state, ...val }));
    form.setFieldsValue({ ...form.getFieldsValue(), ...val });
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

  const handleDelete = (stcode) => {
    const itemDetail = [...listDetail];
    const newData = itemDetail.filter((item) => item?.stcode !== stcode);
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
        onClick={() => handleDelete(record?.stcode)}
        disabled={!record?.stcode}
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
              name="ivcode"
              htmlFor="ivcode-1"
              label="เลขที่ใบแจ้งหนี้"
              className="!mb-1"
              rules={[{ required: true, message: "Missing Invoice" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือกใบเสนอราคา"
                  id="ivcode-1"
                  value={formDetail.ivcode}
                  className="!bg-white"
                />
                {config?.action !== "create" ? (
                  ""
                ) : (
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => setOpenInvoice(true)}
                    style={{ minWidth: 40 }}
                  ></Button>
                )}
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              name="cuscode"
              htmlFor="cuscode-1"
              label="รหัสลูกค้า"
              className="!mb-1"
              rules={[{ required: true, message: "Missing Customer" }]}
            >
              <Input readOnly placeholder="เลือกลูกค้า" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col
            xs={24}
            sm={24}
            md={6}
            lg={6}
            style={
              config.action === "create"
                ? { display: "inline" }
                : { display: "none" }
            }
          >
            <Form.Item
              name="payment_method"
              label="วิธีการชำระ"
              className="!mb-1"
            >
              <Select
                size="large"
                options={[
                  {
                    value: "ชำระทั้งหมด",
                    label: "ชำระทั้งหมด",
                  },
                  {
                    value: "แบ่งชำระ",
                    label: "แบ่งชำระ",
                  },
                ]}
                onChange={(v) => {
                  v !== "ชำระทั้งหมด"
                    ? setOpenPayAmount(true)
                    : setOpenPayAmount(false);
                  form.setFieldValue("price", openBalance);
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              name="price"
              label={"( ยอดคงเหลือ " + comma(openBalance, 2, 2) + " บาท)"}
              // className="!mb-1"
            >
              {openPayAmount ? (
                <InputNumber
                  className="width-100 input-30 text-black "
                  style={{ height: 40 }}
                  placeholder="ยอดเงินทั้งหมด"
                  min="1"
                  max={openBalance}
                />
              ) : (
                <InputNumber
                  className="width-100 input-30 text-end"
                  style={{ height: 40 }}
                  placeholder="ยอดเงินทั้งหมด"
                  disabled
                />
              )}
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              name="payment_type"
              label="ประเภทการชำระ"
              className="!mb-1"
            >
              <Select
                size="large"
                options={[
                  {
                    value: "เช็คธนาคาร",
                    label: "เช็คธนาคาร",
                  },
                  {
                    value: "เงินสด",
                    label: "เงินสด",
                  },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  const SectionBankCheck = (
    <>
      <Row gutter={[8, 8]} className="m-0">
        <Col xs={24} sm={24} md={6} lg={6} xl={6} xxl={6}>
          <Form.Item
            name="bank"
            label="ธนาคาร"
          >
            {/* <Input placeholder='Enter Loading type Name.' /> */}
            <Select
              showSearch
              autoClearSearchValue
              style={{ height: 42, width: "100%" }}
              options={banksOption}
              optionFilterProp="children"
              filterOption={(input, option) => {
                const { record: v } = option;
                const val = input?.toLowerCase();
                return (
                  (v?.official_name?.toLowerCase() ?? "").includes(val) ||
                  (v?.thai_name?.toLowerCase() ?? "").includes(val) ||
                  (v?.key?.toLowerCase() ?? "").includes(val)
                );
              }}
              filterSort={(optionA, optionB) => {
                const { record: v1 } = optionA;
                const { record: v2 } = optionB;

                return (v1?.official_name ?? "")
                  .toLowerCase()
                  .localeCompare((v2?.official_name ?? "").toLowerCase());
              }}
              optionLabelProp="label"
              optionRender={(option) => {
                const { record: v } = option.data;
                return (
                  <>
                    <Flex align="self-end" gap={8}>
                      <i
                        className={`bank bank-${v.key} shadow huge flex flex-grow-1`}
                        style={{ height: 34, width: 34, minWidth: 34 }}
                      ></i>
                      <Flex align="start" gap={1} vertical>
                        <Typography.Text
                          ellipsis
                          style={{ fontSize: 13, maxWidth: "100%" }}
                        >
                          {v.thai_name}
                        </Typography.Text>
                        <Typography.Text
                          ellipsis
                          style={{
                            fontSize: 11,
                            color: "#8c8386",
                            maxWidth: "100%",
                          }}
                        >
                          {v.official_name}
                        </Typography.Text>
                      </Flex>
                    </Flex>
                  </>
                );
              }}
              allowClear
              placeholder="เลือกธนาคาร"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={6} lg={6} xl={6} xxl={6}>
          <Form.Item name="branch" label="สาขา" className="!mb-1">
            <Input placeholder="สาขา" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={6} lg={6} xl={6} xxl={6}>
          <Form.Item name="check_no" label="เลขที่เช็ค" className="!mb-1">
            <Input placeholder="เลขที่เช็ค" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={6} lg={6}>
          <Form.Item label="วันที่เช็ค" name="check_date">
            <DatePicker
              size="large"
              placeholder="วันที่เช็ค."
              className="input-40"
              style={{ width: "100%" }}
              format={dateFormat}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[8, 8]} className="m-0">
        <Col xs={24} sm={24} md={6} lg={6} xl={6} xxl={6}>
          <Form.Item name="check_amount" label="ยอดเงินเช็ค" className="!mb-1">
            <InputNumber
              className="width-100 input-30 text-black"
              style={{ height: 40 }}
              placeholder="ยอดเงินเช็ค"
              min="1"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
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
                        colSpan={6}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        Total
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {comma(Number(formDetail?.total_price || 0), 2, 2)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={5}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        Vat
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Form.Item name="vat" className="!m-0">
                          <InputNumber addonAfter="%" disabled />
                        </Form.Item>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {comma(
                            Number(
                              (formDetail.total_price * formDetail?.vat) / 100
                            ),
                            2,
                            2
                          )}
                        </Typography.Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={6}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        Grand Total
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 text-end border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {comma(
                            Number(formDetail?.grand_total_price || 0),
                            2,
                            2
                          )}
                        </Typography.Text>
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
                    {" "}
                    ข้อมูลเช็คธนาคาร{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionBankCheck}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    {" "}
                    ข้อมูลเพิ่มเติม{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionOther}</Card>
                </Col>
                <Col
                  xs={24}
                  sm={24}
                  md={24}
                  lg={24}
                  xl={24}
                  xxl={24}
                  style={
                    config.action === "create"
                      ? { display: "inline" }
                      : { display: "none" }
                  }
                >
                  <Divider orientation="left" className="!my-0">
                    รายการใบสั่งซื้อสินค้า
                  </Divider>
                  <Card style={{ backgroundColor: "#f0f0f0" }}>
                    {SectionProduct}
                  </Card>
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

      {openBanks && (
        <ModalBanks
          show={openBanks}
          close={() => setOpenBanks(false)}
          values={(v) => {
            handleChoosedBanks(v);
          }}
        ></ModalBanks>
      )}

      {openInvoice && (
        <ModalInvoice
          show={openInvoice}
          close={() => setOpenInvoice(false)}
          values={(v) => {
            handleChoosedInvoice(v);
          }}
        ></ModalInvoice>
      )}

      {openProduct && (
        <ModalItems
          show={openProduct}
          close={() => setOpenProduct(false)}
          values={(v) => {
            handleItemsChoosed(v);
          }}
          selected={listDetail}
        ></ModalItems>
      )}
    </div>
  );
}

export default ReceiptManage;
