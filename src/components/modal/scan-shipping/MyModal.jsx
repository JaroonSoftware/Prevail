/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Modal,
  Spin,
  Space,
  Button,
  Form,
  Row,
  Col,
  Input,
  message,
} from "antd";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

import ItemService from "../../../service/Items.Service";
import BarcodeService from "../../../service/Barcode.service";

import useSound from "use-sound";
import correct from "../../../assets/sounds/correct.mp3";
import errorsound from "../../../assets/sounds/error.mp3";

const itemservice = ItemService();
const barcodeservice = BarcodeService();
export default function ModalScan({ show, selected, close, values }) {
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [correctSound] = useSound(correct);
  const [errorSound] = useSound(errorsound);

  /** handle logic component */
  const handleClose = () => {
    setTimeout(() => {
      close(false);      
    }, 140);    
    
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

  const renderResult = (value, massage, data) => {
    if (value) {
      setTimeout( () => correctSound(), 100 );  
      values(data);
      handleClose();
      message.success(massage);
    } else {
      setTimeout( () => errorSound(), 100 );  
      message.error(massage);
    }
  };

  const ScanCode = (val) => {
    barcodeservice
      .getshipping(val)
      .then((res) => {
        const { data } = res.data;

        // console.log(data.doc_status)

        if (data.doc_status !== undefined) {
          if (data.stcode === form.getFieldValue("stcode")) {
            if (data.weight !== "0.00") {
              if (data.doc_status !== "ขายแล้ว") {
                renderResult(1, "สแกนสำเร็จ", data);
              } else
                renderResult(0, "ส่งสินค้าแล้วให้กับ " + data.dncode, data);
            } else renderResult(0, "ยังไม่ได้ชั่งน้ำหนักสินค้า ", data);
          } else renderResult(0, "รหัสสินค้าไม่ตรงกัน ", data);
        } else renderResult(0, "ไม่รู้จัก Barcode สินค้านี้ ", data);
      })
      .catch((err) => {
        console.log(err);
        message.error("Error getting infomation Product.");
      });
  };

  /** setting child component */
  const ButtonModal = (
    <Space direction="horizontal" size="middle">
      <Button onClick={() => handleClose()}>ปิด</Button>
      {/* <Button type="primary" onClick={() => ScanCode()}>
        ยืนยันการเลือกสินค้า
      </Button> */}
    </Space>
  );

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
              <Form.Item name="stcode" label="รหัสสินค้า" className="!mb-1">
                <Input placeholder="รหัสสินค้า" readOnly />
              </Form.Item>
            </Col>

            <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
              <Form.Item name="stname" label="ชื่อสินค้า" className="!mb-1">
                <Input placeholder="ชื่อสินค้า" readOnly />
              </Form.Item>
            </Col>

            {/* เอาไว้เทส */}
            {/* <Col xs={24} sm={24} md={24} lg={24}>
              <Form.Item name="barcode" label="เลข Barcode" className="!mb-1">
                <Input placeholder="เลข Barcode" />
              </Form.Item>
            </Col> */}
          </Row>
        </Form>
        {/* เอาไว้เทส */}
        {/* <Button onClick={() => ScanCode(form.getFieldValue("barcode"))}>
          Submit test
        </Button> */}
        <Spin spinning={loading}>
          <BarcodeScannerComponent
            width={500}
            height={500}
            onUpdate={(err, result) => {
              if (result) {
                  ScanCode(result.text);
                  // handleClose()
                  // message.success('massage');
              }
            }}
          />
        </Spin>
      </Modal>
    </>
  );
}
