import { useState, useEffect } from "react";
import {
  Divider,
  Row,
  Col,
  Form,
  InputNumber,
  Flex,
  Button,
  Descriptions,
  message,
} from "antd";
import { Table } from "antd";
import { notEnter } from "../../../utils/util";

import { RiDeleteBin5Line } from "react-icons/ri";
import { TbTrash } from "react-icons/tb";
import dayjs from "dayjs";
import { componentsEditable, columnsParametersEditable } from "./model";
// import useConfirm from '../../../store/hook/use-confirm.hook';
// const dateFormat = 'DD/MM/YYYY';

export default function DryCheckDrawer({
  data,
  submit,
  name = "form-data",
}) {
  const dividerProp = {
    orientation: "left",
    style: { marginBlock: 10 },
    className: "!border-black",
  };
  const formRole = { required: true, message: "กรุณากรอกข้อมูลให้ครบถ้วน!" };

  // const confirms = useConfirm();

  const [form] = Form.useForm();
  const values = Form.useWatch([], form);

  const [listDetail, setListDetail] = useState([]);

  const [isValidated, setIsValidated] = useState(false);
  // const [masterItems, setMasterItems] = useState([]);
  const [totalqty, setTotalQty] = useState(0);

  useEffect(() => {
    // console.log(totalqty);
    if (totalqty === 0) setIsValidated(false);
    else setIsValidated(true);
  }, [totalqty]);

  useEffect(() => {
    const init = () => {
      form.setFieldsValue(data);

      const expires = Array.isArray(data?.expire)
        ? data.expire
        : data?.expire
        ? [data.expire]
        : [];

      const sumlist_qty = expires.reduce(
        (a, b) => a + (Number(b?.list_qty || b?.expire_qty) || 0),
        0
      );
      setListDetail(data?.expire);

      setTotalQty(data?.qty - sumlist_qty || 0);

      // setTotalQty(sumlist_qty);
    };

    init();
    return () => {};
  }, [data, form]);

  const handleSave = (row) => {
    const newData = (r) => {
      // console.log( r );
      const itemDetail = [...listDetail];
      const newData = [...itemDetail];

      const ind = newData.findIndex((item) => r?.uuid === item?.uuid);
      if (ind < 0) return itemDetail;
      const item = newData[ind];
      newData.splice(ind, 1, { ...item, ...r });
      const { qty, received } = r;

      const tireAmount = newData?.reduce(
        (val, v) => (val += Number(v?.amount || 0)),
        0
      );
      const receiveAmount = Number(received || 0);
      if (receiveAmount + tireAmount > qty) {
        // confirms.error("จำนวนที่รับมากกว่ารายการสินค้าที่สั่ง");
        return;
      }

      const remain = qty - (tireAmount + Number(receiveAmount));

      // console.log( {remain, tireAmount, received:receiveAmount} );

      form.setFieldValue("amount", tireAmount);
      form.setFieldValue("remain", remain);

      return newData;
    };
    setListDetail([...newData(row)]);
  };

  const handleAddNew = (newItem) => {
    setListDetail((prev) => [...prev, newItem]);
  };

  const handleCreateList = async (mode = 0) => {
    try {
      if (mode) {
        if (totalqty < form.getFieldValue("rqty")) {
          message.error("จำนวนรับมากกว่าจำนวนที่สั่งซื้อ");
          return;
        }
        if (
          !form.getFieldValue("rqty") ||
          form.getFieldValue("rqty") <= 0 ||
          isNaN(form.getFieldValue("rqty"))
        ) {
          message.error("กรุณาระบุจำนวนรับให้ถูกต้อง");
          return;
        }
        handleAddNew({
          seq: listDetail.length + 1,
          stock_date: dayjs(data?.stock_date).format("YYYY-MM-DD"),
          list_qty: Number(form.getFieldValue("rqty")),
          expire_date: dayjs(new Date())
            .add(data?.shelf_life, "day")
            .format("YYYY-MM-DD"),
          // เพิ่ม field อื่นๆ ตามต้องการ
        });
        setTotalQty(totalqty - Number(form.getFieldValue("rqty")));
      } else {
        let total = totalqty;
        if (total <= 0) {
          message.error("จำนวนรับครบแล้ว");
          return;
        }
        handleAddNew({
          seq: listDetail.length + 1,
          stock_date: dayjs(data?.stock_date).format("YYYY-MM-DD"),
          list_qty: Number(total),
          expire_date: dayjs(new Date())
            .add(data?.shelf_life, "day")
            .format("YYYY-MM-DD"),
          // เพิ่ม field อื่นๆ ตามต้องการ
        });
        setTotalQty(totalqty - total);
      }
    } catch (e) {
      console.log(e);
      // confirms.error("เกิดข้อผิดพลาด ทำรายการไม่สำเร็จ");
    }
  };

  const onSubmit = () => {
    // const totalReceived = (listDetail || []).reduce(
    //   (acc, v) => acc + (Number(v?.list_qty || v?.expire_qty) || 0),
    //   0
    // );
    const payload = {
      ...data,
      expire: Array.isArray(listDetail) ? listDetail : [],
      // recamount: totalReceived,
    };
    // console.log("submit payload:", payload);
    if (typeof submit === "function") submit(payload);
  };

  const handleDelete = (code, qty) => {
    setListDetail((prev) => {
      const updated = prev.filter((item) => item?.seq !== code);
      const sumUpdated = updated.reduce(
        (acc, v) => acc + (Number(v?.list_qty || v?.expire_qty) || 0),
        0
      );
      // totalqty = จำนวนที่จะรับทั้งหมด (data.qty) - ผลรวมรายการที่มีอยู่
      const remain = Number(data?.qty || 0) - sumUpdated;
      setTotalQty(remain);
      setIsValidated(remain > 0);
      return updated;
    });

    if (qty > 0) setIsValidated(true);
  };

  const handleAction = (record) => {
    const itemDetail = [...listDetail];
    return itemDetail.length >= 1 ? (
      <Button
        className="bt-icon"
        size="small"
        danger
        icon={
          <RiDeleteBin5Line style={{ fontSize: "1rem", marginTop: "3px" }} />
        }
        onClick={() => handleDelete(record?.seq, record?.list_qty)}
        disabled={!record?.seq}
      />
    ) : null;
  };

  const masterItems = [
    { label: "รหัสสินค้า", children: data?.stcode },
    {
      label: "ชื่อสินค้า",
      children: data?.stname,
      span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
    },
    { label: "วันหมดอายุ", children: data?.shelf_life + " วัน" },
    {
      label: "จำนวนที่สั่งซื้อ",
      children: data?.qty_buy,
      span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
    },
    { label: "จำนวนที่จะรับ", children: data?.qty },
    { label: "คงเหลือ", children: totalqty },
  ];

  const receipt_info = (
    <>
      <Divider {...dividerProp}>ข้อมูลรายการสั่งซื้อ</Divider>
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        items={masterItems}
      />
    </>
  );

  const information = (
    <>
      <Divider {...dividerProp}>หน้าจัดการ</Divider>
      <Row className="!mx-0" gutter={[8, 8]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
          <Form.Item label="ระบุจำนวนรับ :" name="rqty" htmlFor="rqty">
            <Flex className="w-full justify-between gap-2" name="test">
              <InputNumber
                id="rqty"
                name="rqty"
                value={form.getFieldValue("rqty")}
                style={{ width: "75%" }}
                className="input-40"
                controls={false}
                placeholder="กรอกระบุจำนวนรับ"
                onFocus={(e) => e.target.select()}
                min={1}
                max={totalqty}
                disabled={!isValidated}
              />
              <Button
                icon={<TbTrash style={{ fontSize: "1rem" }} />}
                className="bn-center bn-primary-outline"
                onClick={() => handleCreateList(1)}
              >
                รับ
              </Button>
              <Button
                icon={<TbTrash style={{ fontSize: "1rem" }} />}
                className="bn-center bn-success-outline"
                onClick={() => handleCreateList(0)}
              >
                รับทั้งหมด
              </Button>
            </Flex>
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  /** setting column table */
  const prodcolumns = columnsParametersEditable(handleSave, {
    handleAction,
  });

  const list_receipt = (
    <>
      <Divider {...dividerProp}>รายการสินค้าที่รับ</Divider>
      <Table
        // title={() => TitleTable}
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
        onFinish={onSubmit}
      >
        {receipt_info}
        {/* {information}
        {list_receipt} */}
      </Form>
    </>
  );
}
