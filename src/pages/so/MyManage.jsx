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
import { Card, Col, Divider, Flex, Row, Space,  } from "antd";

import OptionService from "../../service/Options.service";
import SOService from "../../service/SO.service";
import { SaveFilled, SearchOutlined } from "@ant-design/icons";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";

import { soForm, columnsParametersEditable, componentsEditable } from "./model";
import { ModalItems } from "../../components/modal/itemsbyCL/modal-items";
import dayjs from "dayjs";
import { delay, comma } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";
import { TbSquareRoundedX, TbExclamationCircle } from "react-icons/tb";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackageSearch } from "react-icons/lu";

const opservice = OptionService();
const soservice = SOService();

const gotoFrom = "/sales-order";
const dateFormat = "DD/MM/YYYY";

function MyManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);

  /** SaleOrder state */
  const [soCode, setSOCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(soForm);

  const [unitOption, setUnitOption] = React.useState([]);

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await soservice
          .get(config?.code)
          .catch((error) => message.error("get SaleOrder data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { socode, sodate,deldate } = header;
        setFormDetail(header);
        setListDetail(detail);
        setSOCode(socode);
        form.setFieldsValue({ ...header, sodate: dayjs(sodate), deldate: dayjs(deldate) });

        // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
        // handleChoosedCustomer(head);
      } else {
        const { data: code } = (
          await soservice.code().catch((e) => {
            message.error("get SaleOrder code fail.");
          })
        ).data;
        setSOCode(code);
        // form.setFieldValue("discount", 0);
        const ininteial_value = {
          ...formDetail,
          socode: code,
          sodate: dayjs(new Date()),
          deldate: dayjs(new Date()),
        };
        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
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
          Number(v?.qty || 0) *
          Number(v?.price || 0) + (Number(v?.qty || 0) *
          Number(v?.price || 0)*(v?.vat/100)) ),
      0
    );
    // const discount = form.getFieldValue("discount");
    // const grand_total_price =
    //   total_price - form.getFieldValue("discount");

    setFormDetail(() => ({
      ...formDetail,
      total_price,
      // discount,
      // grand_total_price,
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

  const handleSO = (e) => {
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
    const customer = {
      ...val,
      address: addr.join(""),
      contact: val.contact,
      tel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customer }));
    form.setFieldsValue({ ...fvalue, ...customer });
  };

  const handleItemsChoosed = (value) => {
    // console.log(value)
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
          sodate: dayjs(form.getFieldValue("sodate")).format("YYYY-MM-DD"),
          deldate: dayjs(form.getFieldValue("deldate")).format("YYYY-MM-DD"),
          remark: form.getFieldValue("remark"),
        };
        const detail = listDetail;

        const parm = { header, detail };
        console.log(parm);
        const actions =
          config?.action !== "create" ? soservice.update : soservice.create;
        actions(parm)
          .then((r) => {
            handleClose().then((r) => {
              message.success("Request SaleOrder success.");
            });
          })
          .catch((err) => {
            message.error("Request SaleOrder fail.");
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
    console.clear();
  };

  const handleDelete = (code) => {
    const itemDetail = [...listDetail];
    const newData = itemDetail.filter((item) => item?.stcode !== code);
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
        disabled={!record?.stcode || config.action !== "create"}
      />
    ) : null;
  };

  const handleCancleSO = () => {
    Modal.confirm({
      title: (
        <Flex align="center" gap={2} className="text-red-700">
          <TbExclamationCircle style={{ fontSize: "1.5rem" }} />
          {"ยืนยันที่จะยกเลิกใบขายสินค้า"}
        </Flex>
      ),
      icon: <></>,
      content: "ต้องการยกเลิกใบขายสินค้า ใช่หรือไม่",
      okText: "ยืนยัน",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk() {
        soservice
          .deleted(formDetail.socode)
          .then((r) => {
            handleClose().then((r) => {
              message.success("ยกเลิกใบขายสินค้าสำเร็จ");
            });
          })
          .catch((err) => {
            message.error("Request SaleOrder fail.");
            console.warn(err);
          });
        // setListSouce((state) => state.filter( soc => soc.stcode !== key));
      },
      // onCancel() { },
    });
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
              rules={[{ required: true, message: "โปรดเลือกลูกค้า" }]}
            >
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  readOnly
                  placeholder="เลือก ลูกค้า"
                  id="cuscode-1"
                  value={formDetail.cuscode}
                  className="!bg-white"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setOpenCustomer(true)}
                  style={{ minWidth: 40 }}
                ></Button>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input placeholder="Customer Name." readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item
              label="วันที่นัดส่งสินค้า"
              name="deldate"
              className="!m-0"
            >
              <DatePicker
                size="large"
                placeholder="วันที่นัดส่งสินค้า"
                className="input-40"
                style={{ width: "100%" }}
                format={dateFormat}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={18} xxl={18}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input placeholder="Customer Address." readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="contact" label="ผู้ติดต่อ" className="!mb-1">
              <Input placeholder="Customer Contact." readOnly />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="tel" label="เบอร์โทรลูกค้า" className="!mb-1">
              <Input placeholder="Customer Tel." readOnly />
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
            รายการใบขายสินค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              form
                .validateFields()
                .then(() => {
                  setOpenProduct(true);
                })
                .catch((err) => {
                  message.error("กรุณาเลือกลูกค้าก่อน");
                });
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
                        colSpan={7}
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
                          {comma(Number(formDetail?.total_price || 0))}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
                    </Table.Summary.Row>
                    {/* <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={7}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={4}
                        align="end"
                        className="!pe-4"
                      >
                        ส่วนลด
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        className="!pe-4 border-right-0"
                        style={{ borderRigth: "0px solid" }}
                      >
                        <Form.Item name="discount" className="!m-0">
                          <InputNumber
                            className="width-100 input-30"
                            controls={false}
                            style={{ textAlignLast: 'right' }} 
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
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={7}
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
                          {comma(Number(formDetail?.grand_total_price || 0))}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
                    </Table.Summary.Row> */}
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
            <Form.Item className="" name="remark" label="Remark">
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
      <Col span={12} className="p-0">
        <Flex gap={4} justify="end">
          {formDetail.active_status === "Y" ? (
            <Button
              icon={<TbSquareRoundedX style={{ fontSize: "1.4rem" }} />}
              type="primary"
              onClick={() => handleCancleSO()}
              className="bn-center justify-center"
              style={{ width: "9.5rem" }}
              danger
            >
              ยกเลิกใบขายสินค้า
            </Button>
          ) : (
            <></>
          )}
          {formDetail.active_status === "Y" || config.action === "create" ? (
            <Button
              className="bn-center justify-center"
              icon={<SaveFilled style={{ fontSize: "1rem" }} />}
              type="primary"
              style={{ width: "9.5rem", marginLeft: "10px" }}
              onClick={() => {
                handleConfirm();
              }}
            >
              Save
            </Button>
          ) : (
            <></>
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
          {formDetail.active_status === "Y" || config.action === "create" ? (
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
          ) : (
            <></>
          )}
        </Flex>
      </Col>
    </Row>
  );

  return (
    <div className="quotation-manage">
      <div id="quotation-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {SectionTop}
          <Form
            form={form}
            layout="vertical"
            className="width-100"
            autoComplete="off"
          >
            {/* style={{ backgroundColor: "red" }} */}
            <Card
              title={
                <>
                  <Row className="m-0 py-3 sm:py-0" gutter={[12, 12]}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Typography.Title level={3} className="m-0">
                        รหัสใบขายสินค้า : {soCode}
                      </Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบขายสินค้า :{" "}
                        </Typography.Title>
                        <Form.Item name="sodate" className="!m-0">
                          <DatePicker
                            className="input-40"
                            allowClear={false}
                            onChange={handleSO}
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
                    Customer{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionCustomer}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    {" "}
                    รายละเอียดอื่นๆ{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionOther}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!my-0">
                    Product
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

      {openCustomer && (
        <ModalCustomers
          show={openCustomer}
          close={() => setOpenCustomer(false)}
          values={(v) => {
            handleChoosedCustomer(v);
          }}
        ></ModalCustomers>
      )}

      {openProduct && (
        <ModalItems
          show={openProduct}
          close={() => setOpenProduct(false)}
          values={(v) => {
            handleItemsChoosed(v);
          }}
          cuscode={form.getFieldValue("cuscode")}
          selected={listDetail}
        ></ModalItems>
      )}
    </div>
  );
}

export default MyManage;
