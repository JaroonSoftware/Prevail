/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Typography, message } from "antd";
import {
  Card,
  Col,
  Flex,
  Row,
  Space,
  Input,
  Divider,
  Select,
  Badge,
  DatePicker,
  Collapse,
} from "antd";
import CatalogService from "../../service/Catalog.Service";
import { SaveFilled, CaretRightOutlined } from "@ant-design/icons";
import {
  columnsParametersEditable,
  componentsEditable,
  columnsParametersEditableCustomer,
} from "./model";
import { ModalItems } from "../../components/modal/items/modal-items";
import { ModalCusCL } from "../../components/modal/customerbyCL/modal-cusCL";
import { delay } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackageSearch } from "react-icons/lu";
import dayjs from "dayjs";
const clservice = CatalogService();
const gotoFrom = "/catalog";

const cardStyle = {
  backgroundColor: "#f0f0f0",
  height: "calc(100% - (25.4px + 1rem))",
};
const RangePicker = DatePicker.RangePicker;

function CatalogManage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };
  const [form] = Form.useForm();
  /** Modal handle */
  const [openCustomerCL, setOpenCustomerCL] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  /** Catalog state */
  const [clCode, setCLCode] = useState(null);
  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);
  const [listCustomer, setCusDetail] = useState([]);
  const [formDetail, setFormDetail] = useState([]);
  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await clservice
          .get(config?.code)
          .catch((error) => message.error("get Catalog data fail."));
        const {
          data: { header, detail, customer },
        } = res.data;
        const { catalog_code, catalog_name, start_date, stop_date, remark } =
          header;
        setFormDetail(header);
        setListDetail(detail);
        setCusDetail(customer);
        setCLCode(catalog_code);

        let tmpdate = [];
        if (!!start_date) tmpdate = [dayjs(start_date), dayjs(stop_date)];
        form.setFieldsValue({
          ...header,
          catalog_name: catalog_name,
          catalog_date: tmpdate,
          remark: remark,
        });
      } else {
        const { data: code } = (
          await clservice.getcode().catch((e) => {
            message.error("get Catalog code fail.");
          })
        ).data;
        // alert()
        setCLCode(code);
        const ininteial_value = {
          ...formDetail,
          catalog_code: code,
        };

        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
      }
      // console.log(unitOprionRes.data.data)
    };

    initial();
    return () => {};
  }, []);

  useEffect(() => {
    if (listDetail);
  }, [listDetail]);

  /** Function modal handle */
  const handleChoosedCustomer = (value) => {
    // console.log(value);
    setCusDetail(value);
  };

  const handleItemsChoosed = (value) => {
    // console.log(value);
    setListDetail(value);
  };

  const handleConfirm = () => {
    form
      .validateFields()
      .then((v) => {
        // if (listDetail.length < 1)
        //   throw new Error("กรุณาเพิ่มข้อมูลให้ถูกต้อง");
        // if (listCustomer.length < 1)
        //   throw new Error("กรุณาเพิ่มข้อมูลให้ถูกต้อง");
        const data = { ...v };

        if (!!data?.catalog_date) {
          const arr = data?.catalog_date.map((m) =>
            dayjs(m).format("YYYY-MM-DD")
          );
          const [start_date, stop_date] = arr;
          //data.created_date = arr
          Object.assign(data, { start_date, stop_date });
        }

        const header = {
          catalog_code: clCode,
          catalog_name: form.getFieldValue("catalog_name"),
          remark: form.getFieldValue("remark"),
          active_status: form.getFieldValue("active_status"),
          start_date: data.start_date,
          stop_date: data.stop_date,
        };

        const detail = listDetail;
        const customer = listCustomer;
        const parm = { header, detail, customer, };
        // console.log(parm);
        const actions =
          config?.action !== "create" ? clservice.update : clservice.create;
        actions(parm)
          .then((r) => {
            handleClose().then((r) => {
              message.success("Request Catalog success.");
            });
          })
          .catch((err) => {
            message.error("Request Catalog fail.");
            console.warn(err);
          });
      })
      .catch((err) => {
        message.error('คุณกรอกข้อมูล ไม่ครบถ้วน');
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
  const handleDeleteCustomer = (code) => {
    const CustomerDetail = [...listCustomer];
    const newData = CustomerDetail.filter((customer) => customer?.cuscode !== code);
    setCusDetail([...newData]);
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
  const handleRemoveCustomer = (record) => {
    const CustomerDetail = [...listCustomer];
    return CustomerDetail.length >= 1 ? (
      <Button
        className="bt-icon"
        size="small"
        danger
        icon={
          <RiDeleteBin5Line style={{ fontSize: "1rem", marginTop: "3px" }} />
        }
        onClick={() => handleDeleteCustomer(record?.cuscode)}
        disabled={!record?.cuscode}
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
      return newData;
    };
    setListDetail([...newData(row)]);
  };
  const handleEditCellCustomer = (row) => {
    const newData = (r) => {
      const CustomerDetail = [...listCustomer];
      const newData = [...CustomerDetail];

      const ind = newData.findIndex(
        (customer) => r?.cuscode === customer?.cuscode
      );
      if (ind < 0) return CustomerDetail;
      const customer = newData[ind];
      newData.splice(ind, 1, {
        ...customer,
        ...row,
      });
      return newData;
    };
    setCusDetail([...newData(row)]);
  };

  /** setting column table */
  const cuscolumns = columnsParametersEditableCustomer(
    handleEditCellCustomer,
    { handleRemoveCustomer }
  );
  const prodcolumns = columnsParametersEditable(handleEditCell,{
    handleRemove,
  });
  const TitleTableCustomer = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายชื่อลูกค้า
          </Typography.Title>
        </Flex>
      </Col>

      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Button
            icon={<LuPackageSearch style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
              setOpenCustomerCL(true);
            }}
          >
            เลือกลูกค้า
          </Button>
        </Flex>
      </Col>
    </Flex>
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
            เลือกสินค้า
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  const SectionDetail = (
    <>
      <Space size="small" direction="vertical" className="flex gap-2">
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={10} md={10} lg={10} xl={10}>
            <Form.Item
              name="catalog_name"
              label="ชื่อแคตตาล๊อก"
              className="!mb-1"
            >
              <Input placeholder="ชื่อแคตตาล๊อก" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8} md={8} lg={8} xl={8}>
            <Form.Item label="วันที่ใช้งาน" name="catalog_date" rules={[{ required: true, message: "โปรดระบุช่วงวันที่ใช้งาน" }]}>
              <RangePicker
                placeholder={["From Date", "To date"]}
                style={{ width: "100%", height: 40 }}                
              />
            </Form.Item>
          </Col>
          <Col
            xs={24}
            sm={6}
            md={6}
            lg={6}
            xl={6}
            style={
              config.action === "edit"
                ? { display: "inline" }
                : { display: "none" }
            }
          >
            <Form.Item label="สถานะการใช้งาน" name="active_status">
              <Select
                size="large"
                options={[
                  {
                    value: "Y",
                    label: <Badge status="success" text="เปิดการใช้งาน" />,
                  },
                  {
                    value: "N",
                    label: <Badge status="error" text="ปิดการใช้งาน" />,
                  },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[8, 8]} className="m-0">
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item className="!mb-1" name="remark" label="หมายเหตุ">
              <Input placeholder="หมายเหตุ" />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );
  const SectionCustomer = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTableCustomer}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listCustomer}
          columns={cuscolumns}
          pagination={false}
          rowKey="cuscode"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
        />
      </Flex>
    </>
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
        />
      </Flex>
    </>
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
  const collapetablecustomer = [
    {
      key: "1",
      label: "รายชื่อลูกค้าที่ใช้แคตตาล๊อก",
      children: (
        <Row className="m-0" gutter={[12, 12]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            {SectionCustomer}
          </Col>
        </Row>
      ),
    },
  ];
  const collapetableitems = [
    {
      key: "1",
      label: "รายการสินค้าในแคตตาล๊อก",
      children: (
        <Row className="m-0" gutter={[12, 12]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            {SectionProduct}
          </Col>
        </Row>
      ),
    },
  ];
  return (
    <div className="catalog-manage">
      <div id="catalog-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
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
                    <Col xs={24} sm={24} md={16} lg={16} xl={16} xxl={16}>
                      <Typography.Title level={3} className="m-0">
                        รหัสแคตตาล๊อก : {clCode}
                      </Typography.Title>
                    </Col>
                  </Row>
                </>
              }
            >
              <Row className="m-0" gutter={[12, 12]}>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Card style={cardStyle}>{SectionDetail}</Card>
                  <Divider orientation="left" className="!mb-3 !mt-1">
                    รายการแคตตาล็อก
                  </Divider>
                </Col>
              </Row>

              <Collapse
                items={collapetablecustomer}
                bordered={false}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
              />
              <br></br>
              <Collapse
                items={collapetableitems}
                bordered={false}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
              />
            </Card>
          </Form>
          {SectionBottom}
        </Space>
      </div>
      {openCustomerCL && (
        <ModalCusCL
          show={openCustomerCL}
          close={() => setOpenCustomerCL(false)}
          values={(v) => {
            handleChoosedCustomer(v);
          }}
          selected={listCustomer}
        ></ModalCusCL>
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

export default CatalogManage;
