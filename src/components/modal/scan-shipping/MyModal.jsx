/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Modal, Spin, Space, Button,Form,Row,Col,Input,message } from "antd";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

import ItemService from "../../../service/Items.Service";
import BarcodeService from "../../../service/Barcode.service";

const itemservice = ItemService();
const barcodeservice = BarcodeService();
export default function ModalScan({ show, selected, close, values }) {
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  /** handle logic component */
  const handleClose = () => {
    setTimeout(() => {
      close(false);
    }, 140);

    //setTimeout( () => close(false), 200 );
  };

  useEffect(() => {
    setTimeout(() => {
      // alert(selected);
      itemservice
      .get(selected)
      .then(async (res) => {
        const { data } = res.data;

        const init = {
          ...data,
        };

        form.setFieldsValue({ ...init });
      })
      .catch((err) => {
        console.log(err);
        message.error("Error getting infomation Product.");
      });

      setLoading(false);
    }, 500);
  }, []);

  /** setting child component */
  const ButtonModal = (
    <Space direction="horizontal" size="middle">
      <Button onClick={() => handleClose()}>ปิด</Button>
      {/* <Button type="primary" onClick={() => handleConfirm()}>
        ยืนยันการเลือกสินค้า
      </Button> */}
    </Space>
  );

  const CloseModal = (val) => {

    barcodeservice.getshipping(val).then(async (res) => {
      const { data } = res.data;

      // console.log(data.barcode_status)

      if(data.barcode_status!=undefined)
      {
        if(data.barcode_status!='ขายแล้ว')
        {
          values(data.barcode_id);
          handleClose(false);
        }
        else{
          message.error("ส่งสินค้าแล้วให้กับ "+data.dncode)
        }  
      }
      else{
        message.error("ไม่รู้จัก Barcode สินค้านี้")
      }
      
    })
    .catch((err) => {
      console.log(err);
      message.error("Error getting infomation Product.");
    });
  };

  return (
    <>
      <Modal
        open={show}
        title="QR Scanning Code"
        onCancel={() => handleClose()}
        footer={ButtonModal}
        maskClosable={false}
        style={{ top: 20 }}
        width={"100%"}
      >
        <Form
        form={form}
        layout="vertical"
        className="width-100"
        autoComplete="off"
      >
        <Row className="m-0" gutter={[12, 12]}>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Form.Item name="stname" label="ชื่อสินค้า" className="!mb-1">
              <Input placeholder="ชื่อสินค้า" readOnly />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Button onClick={() => CloseModal("10")}>test 10</Button>
        <Button onClick={() => CloseModal("11")}>test 11</Button>
        <Button onClick={() => CloseModal("111")}>test 111</Button>
        <Spin spinning={loading}>
          <BarcodeScannerComponent
            width={500}
            height={500}
            onUpdate={(err, result) => {
              if (result) {
                CloseModal(result.text);
              }
            }}
          />
        </Spin>
      </Modal>
    </>
  );
}
