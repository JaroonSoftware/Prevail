/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  // Modal,
  Collapse,
  Table,
  Typography,
  message,
} from "antd";
import { Card, Col, Divider, Flex, Row, Space } from "antd";
import OptionService from "../../service/Options.service";
import PackageService from "../../service/Package.service";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import ModalPreviewPKBarcode from "../../components/modal/print-weight/ModalPreviewPKBarcode";
import {
  soForm,
  columnsParametersEditable,
  componentsEditable,
  columnsParametersInCollape,
} from "./model";
import { ModalItems } from "../../components/modal/itemsbyCL/modal-items";
import dayjs from "dayjs";
import { formatMoney } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation } from "react-router-dom";
import { BarcodeOutlined, PrinterOutlined } from "@ant-design/icons";
// import { useReactToPrint } from "react-to-print";

const opservice = OptionService();
const pkservice = PackageService();

const gotoFrom = "/print-weight";
const dateFormat = "DD/MM/YYYY";

function MyManage() {
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);

  /** SaleOrder state */
  const [soCode, setSOCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(soForm);

  const [unitOption, setUnitOption] = React.useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [resultData, setResultData] = useState([]);

  const printRef = useRef();

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
        const res = await pkservice
          .get(config?.code)
          .catch((error) => message.error("get SaleOrder data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { socode, sodate } = header;
        setFormDetail(header);
        /* ติด _rowKey ที่ไม่ซ้ำให้ทุกแถวตั้งแต่ตอนโหลด
           ใช้ stcode เป็น rowKey ไม่ได้ เพราะใบขายเดียวกันใส่สินค้าตัวเดียวกัน
           ซ้ำหลายบรรทัดได้ (คนละราคา/คนละหน่วย) แล้วติ๊กทีเดียวจะเลือกติดกันหมด */
        setListDetail(
          (detail || []).map((item, i) => ({
            ...item,
            _rowKey: `${item?.socode ?? ""}::${item?.stcode ?? ""}::${i}`,
          }))
        );
        setSOCode(socode);
        form.setFieldsValue({ ...header, sodate: dayjs(sodate) });

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
            (1 - Number(v?.discount || 0) / 100) +
          Number(v.qty || 0) *
            Number(v?.price || 0) *
            (1 - Number(v?.discount || 0) / 100) *
            (v.vat / 100)),
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
      cusaddress: addr.join(""),
      cuscontact: val.contact,
      custel: val?.tel?.replace(/[^(0-9, \-, \s, \\,)]/g, "")?.trim(),
    };
    // console.log(val.contact)
    setFormDetail((state) => ({ ...state, ...customer }));
    form.setFieldsValue({ ...fvalue, ...customer });
  };

  const handleItemsChoosed = (value) => {
    /* ติด _rowKey ให้รายการที่เลือกใหม่ด้วย ไม่งั้นตารางจะไม่มี key ที่ไม่ซ้ำ */
    setListDetail(
      (value || []).map((item, i) => ({
        ...item,
        _rowKey: item?._rowKey || `${item?.socode ?? ""}::${item?.stcode ?? ""}::${i}`,
      }))
    );
    handleSummaryPrice();
  };

  const handlePrint = () => {
    /* รวมบรรทัดที่รหัสสินค้าซ้ำกันให้เหลือรายการเดียวก่อนส่ง

       ฝั่ง backend ผูก package_barcode ไว้กับ socode + stcode เท่านั้น
       ไม่มีตัวระบุว่าเป็นบรรทัดไหนของใบขาย ถ้าส่งสินค้าตัวเดียวกันไป
       หลายบรรทัด จะเกิดปัญหาต่อกันเป็นทอด:
         1. บรรทัดแรกสร้างถุง แล้วสั่ง update packing_status
            ด้วยเงื่อนไข socode+stcode ซึ่งไปโดนบรรทัดที่ซ้ำกันทั้งหมด
         2. พอวนมาบรรทัดที่ 2 ระบบเห็นว่า "ปริ้นแล้ว" เลยข้ามการสร้างถุง
            แล้วไปดึงถุงของบรรทัดแรกมาแสดงซ้ำ
         -> ได้ฉลากซ้ำ จำนวนถุงขาด และน้ำหนักไม่ตรงกับที่สั่ง

       รวมจำนวนเข้าด้วยกันก่อนจึงถูกต้องกว่า เพราะถุงเป็นของจริงทางกายภาพ
       สินค้าตัวเดียวกันย่อมใช้ packing_weight เดียวกัน (มาจากตาราง items) */
    const mergedMap = new Map();
    selectedData.forEach((it) => {
      const key = `${it?.socode ?? ""}::${it?.stcode ?? ""}`;
      const prev = mergedMap.get(key);
      if (prev) {
        prev.qty = Number(prev.qty || 0) + Number(it?.qty || 0);
      } else {
        mergedMap.set(key, { ...it, qty: Number(it?.qty || 0) });
      }
    });
    const chosen = [...mergedMap.values()];

    let obj = { detail: chosen };

    pkservice
      .printpackage(obj)
      .then((r) => {
        const raw = r?.data?.data;

        /* backend เวอร์ชันเก่าอาจคืนเป็น object เมื่อ index ขาดช่วง
           (เช่น {"0":[...],"2":[...]}) แทนที่จะเป็น array แปลงให้รองรับทั้งสองแบบ */
        const groups = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object"
          ? Object.values(raw)
          : [];

        const withUnit = groups.map((group, gi) =>
          (Array.isArray(group) ? group : []).map((item) => ({
            ...item,
            unit: item?.unit || chosen[gi]?.unit || "",
          }))
        );

        const total = withUnit.reduce((n, g) => n + g.length, 0);
        if (total < 1) {
          /* ไม่เปิด modal เปล่าๆ ให้งง บอกไปเลยว่าไม่มีฉลากถูกสร้าง */
          console.warn("print-pk.php ตอบกลับ:", raw);
          message.warning(
            "ไม่มีฉลากถูกสร้าง — รายการนี้อาจถูกมาร์คว่าปริ้นแล้ว แต่ไม่มีข้อมูลถุงใน package_barcode"
          );
          return;
        }

        setResultData(withUnit);
        setOpenPrint(true);
      })
      .catch((err) => {
        /* แสดงข้อความจริงจาก API แทนข้อความรวมๆ จะได้รู้ว่าพังตรงไหน */
        const msg =
          err?.response?.data?.message || err?.message || "Something went wrong !";
        console.error("print-pk.php error:", err?.response?.data ?? err);
        message.error(msg);
      });
  };

  const handleRemove = (record) => {
    const itemDetail = [...listDetail];
    return itemDetail.length >= 1 ? (
      <Button
        className="bt-icon"
        icon={
          <BarcodeOutlined
            style={{ fontSize: "1rem", marginTop: "3px", color: "##2ecc71" }}
          />
        }
      />
    ) : null;
  };

  const handleEditCell = (row) => {
    const newData = (r) => {
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      /* หาแถวด้วย _rowKey ไม่ใช่ stcode ไม่งั้นถ้าสินค้าซ้ำกันหลายบรรทัด
         การแก้บรรทัดล่างจะไปเขียนทับบรรทัดแรกที่เจอแทน */
      const ind = newData.findIndex((item) => r?._rowKey === item?._rowKey);
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

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
      setSelectedData(selectedRows);
      // console.log(selectedData)
    },
  };

  /** setting column table */
  const prodcolumns = columnsParametersEditable(handleEditCell, unitOption, {
    handleRemove,
  });

  const prodcolumnsincollape = columnsParametersInCollape(
    handleEditCell,
    unitOption,
    {
      handleRemove,
    }
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
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="cusname" label="ชื่อลูกค้า" className="!mb-1">
              <Input
                placeholder="Customer Name."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Form.Item name="address" label="ที่อยู่" className="!mb-1">
              <Input
                placeholder="Customer Address."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="contact" label="ผู้ติดต่อ" className="!mb-1">
              <Input
                placeholder="Customer Contact."
                readOnly
                className="!bg-white"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="tel" label="เบอร์โทรลูกค้า" className="!mb-1">
              <Input
                placeholder="Customer Tel."
                readOnly
                className="!bg-white"
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
            รายการหน้าถุงสินค้า
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex justify="end">
          <Button
            icon={<PrinterOutlined style={{ fontSize: "1.2rem" }} />}
            className="bn-center justify-center bn-primary-outline"
            onClick={() => {
            if (selectedData.length < 1) throw message.error("กรุณาเลือกสินค้าก่อนปริ้น");
              handlePrint();
            }}
          >
            Print
          </Button>
        </Flex>
      </Col>
    </Flex>
  );
  const TitleTableIncollape = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            รายการใบขายสินค้า
          </Typography.Title>
        </Flex>
      </Col>
    </Flex>
  );
  const SectionProduct = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTable}
          rowSelection={{
            type: "checkbox",
            ...rowSelection,
          }}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          readOnly
          dataSource={listDetail}
          columns={prodcolumns}
          pagination={false}
          rowKey="_rowKey"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          summary={(record) => {
            return <>{listDetail.length > 0}</>;
          }}
        />
      </Flex>
    </>
  );
  const SectionProductIncollpe = (
    <>
      <Flex className="width-100" vertical gap={4}>
        <Table
          title={() => TitleTableIncollape}
          components={componentsEditable}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={listDetail}
          columns={prodcolumnsincollape}
          pagination={false}
          rowKey="_rowKey"
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
            <Form.Item name="remark" label="Remark">
              <Input.TextArea placeholder="Enter Remark" rows={4} />
            </Form.Item>
          </Col>
        </Row>
      </Space>
    </>
  );

  ///** button */

  const back = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={gotoFrom} />
        </Flex>
      </Col>
    </Row>
  );

  return (
    <div className="quotation-manage">
      <div id="quotation-manage" className="px-0 sm:px-0 md:px-8 lg:px-8">
        <Space direction="vertical" className="flex gap-4">
          {back}
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
                          วันที่ใบขายสินค้า :
                        </Typography.Title>
                        <Form.Item name="sodate" className="!m-0">
                          <DatePicker
                            className="input-40"
                            disabled
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
              <Collapse
                items={[
                  {
                    key: "1",
                    label: "ข้อมูลใบขายสินค้า",
                    children: (
                      <Row className="m-0" gutter={[12, 12]}>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Divider orientation="left" className="!mb-3 !mt-1">
                            Customer
                          </Divider>
                          <Card style={cardStyle}>{SectionCustomer}</Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Divider orientation="left" className="!mb-3 !mt-1">
                            รายละเอียดอื่นๆ
                          </Divider>
                          <Card style={cardStyle}>{SectionOther}</Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                          <Divider orientation="left" className="!mb-3 !mt-1">
                            Product
                          </Divider>
                          <Card style={{ backgroundColor: "#f0f0f0" }}>
                            {SectionProductIncollpe}
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                ]}
              />
              <br></br>
              <Divider orientation="left" className="!mb-3 !mt-1">
                Print
              </Divider>
              <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                <Card style={{ backgroundColor: "#f0f0f0" }}>
                  {SectionProduct}
                </Card>
              </Col>
            </Card>
          </Form>
          {back}
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

      {openPrint && (
        <ModalPreviewPKBarcode
          show={openPrint}
          close={() => setOpenPrint(false)}
          printRef={printRef}
          printData={resultData}
          // isReprint={true}
        />
      )}
    </div>
  );
}

export default MyManage;
