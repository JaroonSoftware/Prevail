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
import { Card, Col, Divider, Flex, Row, Space, Select,InputNumber } from "antd";

import OptionService from "../../service/Options.service";
import InvoiceService from "../../service/Invoice.service";
import QuotationService from "../../service/Quotation.service";
import { SaveFilled, SearchOutlined } from "@ant-design/icons";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import ModalQuotation from "../../components/modal/quotation/MyModal";
import { ModalItems } from "../../components/modal/items/modal-items";

import {
  DEFALUT_CHECK_INVOICE,
  columnsParametersEditable,
  componentsEditable,
} from "./model";

import dayjs from "dayjs";
import { delay, comma } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";

import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackageSearch } from "react-icons/lu";
import { LuPrinter } from "react-icons/lu";
const opservice = OptionService();
const ivservice = InvoiceService();
const qtservice = QuotationService();

const gotoFrom = "/iv";
const dateFormat = 'DD/MM/YYYY';

function InvoiceManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openQuotation, setOpenQuotation] = useState(false);

  /** Invoice state */
  const [ivCode, setIVCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_INVOICE);

  const [unitOption, setUnitOption] = React.useState([]);

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await ivservice
          .get(config?.code)
          .catch((error) => message.error("get Invoice data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { ivcode, ivdate,deldate } = header;
        setFormDetail(header);
        setListDetail(detail);
        setIVCode(ivcode);
        form.setFieldsValue({ ...header, ivdate: dayjs(ivdate), deldate: dayjs(deldate) });

        // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
        // handleChoosedCustomers(head);
      } else {
        const { data: code } = (
          await ivservice.code().catch((e) => {
            message.error("get Invoice code fail.");
          })
        ).data;
        setIVCode(code);
        
        const ininteial_value = {
          ...formDetail,
          ivcode: code,
          ivdate: dayjs(new Date()),
        };
        
        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
        form.setFieldValue("vat", 7);
        form.setFieldValue("payment", "เงินสด");
        form.setFieldValue("deldate", dayjs(new Date()));
        
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
      qtcode: "",
      cusname: cusname.join(""),
      address: addr.join(""),
      contact: val.contact,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customers }));
    form.setFieldsValue({ ...fvalue, ...customers });
    // setListDetail([]);
  };

  const handleChoosedQuotation = async (val) => {
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
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    const res = await qtservice.get(val.qtcode);    
    const {
      data: { detail },
    } = res.data;
    setListDetail(detail);
    handleSummaryPrice();
    // console.log(quotation)
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
        if (listDetail.length < 1) throw new Error("กรุณาเพิ่ม รายการขาย");

        const header = {
          ...formDetail,
          ivdate: dayjs(form.getFieldValue("ivdate")).format("YYYY-MM-DD"),
          remark: form.getFieldValue("remark"),
          deldate: dayjs(form.getFieldValue("deldate")).format("YYYY-MM-DD"),
          payment: form.getFieldValue("payment"),
        };
        const detail = listDetail;

        const parm = { header, detail };
        // console.log(parm)
        const actions =
          config?.action !== "create" ? ivservice.update : ivservice.create;
        actions(parm)
          .then((r) => {
            handleClose().then((r) => {
              message.success("Request Invoice success.");
            });
          })
          .catch((err) => {
            message.error("Request Invoice fail.");
            console.warn(err);
          });
      })
      .catch((err) => {
        Modal.error({
          title: "This is an error message",
          content: "คุณกรอกข้อมูล ไม่ครบถ้วน",
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
              name="qtcode"
              htmlFor="qtcode-1"
              label="เลขที่ใบเสนอราคา"
              className="!mb-1"
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือกใบเสนอราคา"
                  id="qtcode-1"
                  value={formDetail.qtcode}
                  className="!bg-white"
                />
                {config?.action !== "create" ? '' : <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setOpenQuotation(true)}
                  style={{ minWidth: 40 }}
                ></Button>}
                
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
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือกลูกค้า"
                  id="cuscode-1"
                  value={formDetail.cuscode}
                  className="!bg-white"
                />
                {config?.action !== "create" ? '' : <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setOpenCustomers(true)}
                  style={{ minWidth: 40 }}
                ></Button>}                
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="ชื่อลูกค้า" readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input placeholder="ที่อยู่" readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              label="เงื่อนไขการชำระเงิน"
              name="payment"
              rules={[{ required: true, message: "Please input your data!" }]}
            >
              <Select
                style={{ height: 40 }}
                options={[
                  { value: "เงินสด", label: "เงินสด" },
                  { value: "30 วัน", label: "30 วัน" },
                  { value: "45 วัน", label: "45 วัน" },
                  { value: "60 วัน", label: "60 วัน" },
                  { value: "90 วัน", label: "90 วัน" },
                  { value: "120 วัน", label: "120 วัน" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item label="วันครบกำหนด" name="deldate">
              <DatePicker
                size="large"
                placeholder="วันครบกำหนด."
                className="input-40"
                style={{ width: "100%" }}
              />
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
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenProduct(true);
            }}
          >
            Choose Product
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
                          {comma(Number(formDetail?.total_price || 0),2,2)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
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
                          <InputNumber
                            className="width-100 input-30 text-end"
                            addonAfter="%"
                            controls={false}
                            min={0}
                            onFocus={(e) => {
                              e.target.select();
                            }}
                            onChange={() => {
                              handleSummaryPrice();
                            }}
                          />
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
                            ),2,2
                          )}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
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
                          {comma(Number(formDetail?.grand_total_price || 0),2,2)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
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
                        เลขที่ใบแจ้งหนี้ : {ivCode}
                      </Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบแจ้งหนี้ :{" "}
                        </Typography.Title>
                        <Form.Item name="ivdate" className="!m-0">
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
                    ข้อมูลใบแจ้งหนี้{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionCustomers}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!my-0">
                    รายการใบสั่งซื้อสินค้า
                  </Divider>
                  <Card style={{ backgroundColor: "#f0f0f0" }}>
                    {SectionProduct}
                  </Card>
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

      {openQuotation && (
        <ModalQuotation
          show={openQuotation}
          close={() => setOpenQuotation(false)}
          values={(v) => {
            handleChoosedQuotation(v);
          }}
        ></ModalQuotation>
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

export default InvoiceManage;
