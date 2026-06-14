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
import {
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Space,
  Select,
  InputNumber,
} from "antd";

import BillingNoteService from "../../service/BillingNote.Service";
import SOService from "../../service/SO.service";
import OptionService from "../../service/Options.service";
import { SaveFilled, SearchOutlined } from "@ant-design/icons";
import ModalCustomers from "../../components/modal/customers/ModalCustomers";
import { ModalDeliverynoteBilling } from "../../components/modal/delivery-note-for-billing";
import ModalEditItem from "../../components/modal/edit-item/ModalEditItem";

import {
  DEFALUT_CHECK_INVOICE,
  prodcolumns as groupedDnColumns,
  detailColumns
} from "./model";

import dayjs from "dayjs";
import { delay, formatMoney } from "../../utils/util";
import { ButtonBack } from "../../components/button";
import { useLocation, useNavigate } from "react-router-dom";
import {TbSquareRoundedX} from "react-icons/tb";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuPackageSearch } from "react-icons/lu";
import { LuPrinter } from "react-icons/lu";
const blservice = BillingNoteService();
const soservice = SOService();
const opservice = OptionService();

const gotoFrom = "/billing";
const dateFormat = "DD/MM/YYYY";

const getBillingRowKey = (item) => (
  item?._rowKey || [item?.dncode, item?.socode, item?.code].filter(Boolean).join("::")
);

const normalizeBillingDetail = (items = []) => (
  items.map((item) => ({
    ...item,
    _rowKey: getBillingRowKey(item),
  }))
);

const groupBillingDetailByDn = (items = []) => {
  const grouped = items.reduce((collection, item) => {
    const groupKey = item?.dncode || item?._rowKey;

    if (!groupKey) {
      return collection;
    }

    const qty = Number(item?.qty || 0);
    const price = Number(item?.price || 0);
    const totalPrice = qty * price;
    const current = collection[groupKey];

    if (!current) {
      collection[groupKey] = {
        _groupRowKey: groupKey,
        dncode: groupKey,
        dndate: item?.dndate || null,
        socodes: item?.socode ? [item.socode] : [],
        qty,
        total_price: totalPrice,
        itemCount: 1,
        detailRows: [item],
      };
      return collection;
    }

    if (item?.socode && !current.socodes.includes(item.socode)) {
      current.socodes.push(item.socode);
    }

    current.qty += qty;
    current.total_price += totalPrice;
    current.itemCount += 1;
    current.detailRows.push(item);
    return collection;
  }, {});

  return Object.values(grouped).map((item) => ({
    ...item,
    socode: item.socodes.join(", "),
  }));
};

function BillingnoteManage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();

  /** Modal handle */
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openEditItemModal, setOpenEditItemModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [savingEditItem, setSavingEditItem] = useState(false);

  /** Billing Note state */
  const [blCode, setBLCode] = useState(null);

  /** Detail Data State */
  const [listDetail, setListDetail] = useState([]);

  const [formDetail, setFormDetail] = useState(DEFALUT_CHECK_INVOICE);
  const [editItemForm] = Form.useForm();

  const cardStyle = {
    backgroundColor: "#f0f0f0",
    height: "calc(100% - (25.4px + 1rem))",
  };

  useEffect(() => {
    const initial = async () => {
      if (config?.action !== "create") {
        const res = await blservice
          .get(config?.code)
          .catch((error) => message.error("get Billing Note data fail."));
        const {
          data: { header, detail },
        } = res.data;
        const { blcode, bldate, duedate } = header;
        // console.log(header)
        setFormDetail(header);
        setListDetail(normalizeBillingDetail(detail));
        setBLCode(blcode);

        form.setFieldsValue({
          ...header,
          bldate: dayjs(bldate),
          duedate: dayjs(duedate),
        });

        // setTimeout( () => {  handleCalculatePrice(head?.valid_price_until, head?.dated_price_until) }, 200);
        // handleChoosedCustomers(head);
      } else {
        const { data: code } = (
          await blservice.code().catch((e) => {
            message.error("get Billing Note code fail.");
          })
        ).data;
        setBLCode(code);

        const ininteial_value = {
          ...formDetail,
          blcode: code,
          bldate: dayjs(new Date()),
        };

        setFormDetail(ininteial_value);
        form.setFieldsValue(ininteial_value);
        form.setFieldValue("discount", 0);
        form.setFieldValue("payment", "เงินสด");
        form.setFieldValue("duedate", dayjs(new Date()));
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
      (a, v) => (a += Number(v?.qty || 0) * Number(v?.price || 0)),
      0,
    );
    const discount = form.getFieldValue("discount");
    const grand_total_price = total_price - form.getFieldValue("discount");

    setFormDetail(() => ({
      ...formDetail,
      total_price,
      discount,
      grand_total_price,
    }));
    // console.log(formDetail)
  };

  const handleCalculatePrice = (day, date) => {
    const newDateAfterAdding = dayjs(date || new Date()).add(
      Number(day),
      "day",
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

  const handleItemsChoosed = async (val) => {
    const newData = normalizeBillingDetail(val).map((item) => ({
      ...item,
      qty: Number(item?.qty || 0),
      price: Number(item?.price || 0),
    }));

    setListDetail(newData);
  };

  const handleConfirm = () => {
    form
      .validateFields()
      .then((v) => {
        if (listDetail.length < 1) throw new Error("กรุณาเพิ่ม รายการขาย");

        const header = {
          ...formDetail,
          bldate: dayjs(form.getFieldValue("bldate")).format("YYYY-MM-DD"),
          remark: form.getFieldValue("remark"),
          duedate: dayjs(form.getFieldValue("duedate")).format("YYYY-MM-DD"),
          payment: form.getFieldValue("payment"),
          discount: form.getFieldValue("discount"),
        };
        const detail = listDetail;

        const parm = { header, detail };
        // console.log(detail);
        const actions =
          config?.action !== "create" ? blservice.update : blservice.create;
        actions(parm)
          .then((r) => {
            handleClose().then((r) => {
              message.success("Request Billing Note success.");
            });
          })
          .catch((err) => {
            message.error("Request Billing Note fail.");
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

  const handleDelete = (dncode) => {
    const itemDetail = [...listDetail];
    const newData = itemDetail.filter((item) => item?.dncode !== dncode);
    setListDetail([...newData]);
  };

  const isLockedStatus = ["ออกใบเสร็จแล้ว", "ยกเลิก"].includes(
    formDetail?.doc_status,
  );

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
        onClick={() => {
          if (isLockedStatus) return;
          handleDelete(record?.dncode);
        }}
        disabled={!record?.dncode || isLockedStatus}
        // disabled={!record?.code || config.action !== "create"}
      />
    ) : null;
  };

  const handleOpenEditItemModal = (record) => {
    setEditingGroup(record);
    setEditingItem(null);
    editItemForm.resetFields();
    setOpenEditItemModal(true);
  };

  const handleCloseEditItemModal = () => {
    setOpenEditItemModal(false);
    setEditingGroup(null);
    setEditingItem(null);
    editItemForm.resetFields();
  };

  const handleSelectEditItem = (record) => {
    setEditingItem(record);
    editItemForm.setFieldsValue({
      qty: Number(record?.qty || 0),
      price: Number(record?.price || 0),
    });
  };

  const calculateSoTotalPrice = (detail = []) => (
    detail.reduce((total, item) => {
      const qty = Number(item?.qty || 0);
      const price = Number(item?.price || 0);
      const vat = Number(item?.vat || 0);
      return total + qty * price + qty * price * (vat / 100);
    }, 0)
  );

  const handleSaveEditItem = async () => {
    if (!editingItem?.socode || !editingItem?.stcode) {
      message.warning("ไม่พบรายการใบขายสินค้าที่ต้องการแก้ไข");
      return;
    }

    try {
      const values = await editItemForm.validateFields();
      const nextQty = Number(values?.qty || 0);
      const nextPrice = Number(values?.price || 0);

      setSavingEditItem(true);

      const soResponse = await soservice.get(editingItem.socode, { ignoreLoading: true });
      const { header, detail } = soResponse?.data?.data || {};
      const soDetail = Array.isArray(detail) ? [...detail] : [];

      const targetIndex = soDetail.findIndex((item) => item?.stcode === editingItem.stcode);
      if (targetIndex < 0) {
        throw new Error("ไม่พบรายการสินค้าในใบขายสินค้า");
      }

      const updatedDetail = soDetail.map((item, index) => (
        index === targetIndex
          ? {
              ...item,
              qty: nextQty,
              price: nextPrice,
            }
          : item
      ));

      const updatedHeader = {
        ...header,
        total_price: calculateSoTotalPrice(updatedDetail),
      };

      await soservice.update({
        header: updatedHeader,
        detail: updatedDetail,
      }, { ignoreLoading: true });

      setListDetail((state) => state.map((item) => (
        item?._rowKey === editingItem._rowKey
          ? {
              ...item,
              qty: nextQty,
              price: nextPrice,
            }
          : item
      )));

      setEditingGroup((state) => {
        if (!state) {
          return state;
        }

        return {
          ...state,
          detailRows: (state.detailRows || []).map((item) => (
            item?._rowKey === editingItem._rowKey
              ? {
                  ...item,
                  qty: nextQty,
                  price: nextPrice,
                }
              : item
          )),
        };
      });

      setEditingItem((state) => (
        state
          ? {
              ...state,
              qty: nextQty,
              price: nextPrice,
            }
          : state
      ));

      message.success("แก้ไขรายการและอัปเดตใบขายสินค้าแล้ว");
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      message.error(error?.message || "แก้ไขรายการสินค้าไม่สำเร็จ");
    } finally {
      setSavingEditItem(false);
    }
  };

  const handleCancelBilling = () => {
    Modal.confirm({
      title: "ยืนยันที่จะยกเลิกใบวางบิล",
      content: "ต้องการยกเลิกใบวางบิล ใช่หรือไม่",
      okText: "ยืนยัน",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk() {
        return blservice
          .deleted(formDetail?.blcode || config?.code)
          .then(() => {
            return handleClose().then(() => {
              message.success("ยกเลิกใบวางบิลสำเร็จ");
            });
          })
          .catch((err) => {
            message.error("Request Billing Note fail.");
            console.warn(err);
          });
      },
    });
  };

  const groupedListDetail = groupBillingDetailByDn(listDetail);


  const prodcolumns = groupedDnColumns({
    handleRemove,
    handleEdit: handleOpenEditItemModal,
  });

  const editItemColumns = [
    {
      title: "ลำดับ",
      key: "__index",
      width: 70,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "เลขที่ SO",
      dataIndex: "socode",
      key: "socode",
      width: 130,
      align: "center",
    },
    {
      title: "รหัสสินค้า",
      dataIndex: "stcode",
      key: "stcode",
      width: 110,
      align: "center",
    },
    {
      title: "ชื่อสินค้า",
      key: "stname",
      render: (_, record) => record?.stname || record?.purdetail || "-",
    },
    {
      title: "จำนวน",
      dataIndex: "qty",
      key: "qty",
      width: 110,
      align: "right",
      render: (value) => formatMoney(Number(value || 0), 2),
    },
    {
      title: "ราคาขาย",
      dataIndex: "price",
      key: "price",
      width: 110,
      align: "right",
      render: (value) => formatMoney(Number(value || 0), 2),
    },
    {
      title: "เลือก",
      key: "edit",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          type={editingItem?._rowKey === record?._rowKey ? "primary" : "default"}
          onClick={() => handleSelectEditItem(record)}
        >
          แก้ไข
        </Button>
      ),
    },
  ];

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
            <Form.Item label="วันครบกำหนดชำระเงิน" name="duedate">
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
            disabled={isLockedStatus}
          >
            เพิ่มใบส่งของ
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
          bordered
          dataSource={groupedListDetail}
          columns={prodcolumns}
          pagination={false}
          rowKey="_groupRowKey"
          expandable={{
            expandedRowRender: (record) => (
                <Table
                  bordered
                  size="small"
                  pagination={false}
                  dataSource={record.detailRows}
                  columns={detailColumns}
                  rowKey="_rowKey"
                />
            ),
            rowExpandable: (record) => (record?.detailRows || []).length > 0,
          }}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          summary={(record) => {
            return (
              <>
                {groupedListDetail.length > 0 && (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={4}
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
                        style={{ borderRight: "0px solid" }}
                      >
                        <Typography.Text type="danger">
                          {formatMoney(Number(formDetail?.total_price || 0))}
                        </Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>Baht</Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={4}
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
                            style={{ textAlignLast: "right" }}
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
                        colSpan={4}
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
                          {formatMoney(
                            Number(formDetail?.grand_total_price || 0),
                          )}
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
          {config?.action !== "create" && (
            <Button
              icon={<TbSquareRoundedX style={{ fontSize: "1.4rem" }} />}
              type="primary"
              className="bn-center justify-center"
              style={{ width: "9.5rem" }}
              danger
              onClick={() => {
                if (isLockedStatus) return;
                handleCancelBilling();
              }}
              disabled={isLockedStatus}
            >
              ยกเลิกใบวางบิล
            </Button>
          )}
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
                        เลขที่ใบวางบิล : {blCode}
                      </Typography.Title>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                      <Flex
                        gap={10}
                        align="center"
                        className="justify-start sm:justify-end"
                      >
                        <Typography.Title level={3} className="m-0">
                          วันที่ใบวางบิล :{" "}
                        </Typography.Title>
                        <Form.Item name="bldate" className="!m-0">
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
                    ข้อมูลใบวางบิล{" "}
                  </Divider>
                  <Card style={cardStyle}>{SectionCustomers}</Card>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Divider orientation="left" className="!my-0">
                    รายการใบวางบิล
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
          fetchOptions={config?.action === "create" ? opservice.optionsCustomerPendingBL : undefined}
          showPendingDN={config?.action === "create"}
        ></ModalCustomers>
      )}

      {openProduct && (
        <ModalDeliverynoteBilling
          show={openProduct}
          close={() => setOpenProduct(false)}
          values={(v) => {
            handleItemsChoosed(v);
          }}
          cuscode={form.getFieldValue("cuscode")}
          selected={listDetail}
        ></ModalDeliverynoteBilling>
      )}

      <ModalEditItem
        open={openEditItemModal}
        editingGroup={editingGroup}
        editingItem={editingItem}
        savingEditItem={savingEditItem}
        editItemForm={editItemForm}
        editItemColumns={editItemColumns}
        onCancel={handleCloseEditItemModal}
        onSaveEditItem={handleSaveEditItem}
        onSelectEditItem={handleSelectEditItem}
      />
    </div>
  );
}

export default BillingnoteManage;
