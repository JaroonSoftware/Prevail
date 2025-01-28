import React, { useState, useEffect } from "react";

import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space, Drawer } from "antd";
import { Input, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from "antd/es/form/Form";

// import { ModalDeliveryManage } from './modal-delivery.js';

import { deliverynoteColumn } from "./modal-delivery.model.js";
import DeliveryrService from "../../../service/DeliveryNote.service.js";
import OptionService from "../../../service/Options.service";

const dnservice = DeliveryrService();
const opservice = OptionService();

export default function ModalDeliverynote({ show, close, values, selected }) {
  const [form] = useForm();

  const [deliveryData, setCustomersData] = useState([]);
  const [deliveryDataWrap, setDeliveryDataWrap] = useState([]);

  const [openModal, setOpenModel] = useState(show);
  const [loading, setLoading] = useState(true);

  const [openManage, setOpenManage] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  /** handle logic component */
  const handleClose = () => {
    setTimeout(() => {
      close(false);
    }, 140);

    //setTimeout( () => close(false), 200 );
  };

  const handleSearch = (value) => {
    if (!!value) {
      const f = deliveryData.filter(
        (d) =>
          d.dncode?.toLowerCase().includes(value?.toLowerCase()) ||
          d.cusname?.toLowerCase().includes(value?.toLowerCase())
      );

      setDeliveryDataWrap(f);
    } else {
      setDeliveryDataWrap(deliveryData);
    }
  };

  const handleChoose = async (value) => {
    let { dncode } = value;

    const res = await dnservice
      .get(dncode)
      .catch((error) => message.error("get Delivery Note data fail."));
    
    values(res.data);
    setOpenModel(false);
  };

  /** setting initial component */
  const column = deliverynoteColumn({ handleChoose });
  const search = () => {
    setLoading(true);
    opservice
      .optionsDeliverynote()
      .then((res) => {
        let { data } = res.data;
        setCustomersData(data);
        setDeliveryDataWrap(data);
        // console.log(modalData, data)
      })
      .catch((err) => {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "error request");
        // setLoading(false);
      })
      .finally(() =>
        setTimeout(() => {
          setLoading(false);
        }, 400)
      );
  };

  useEffect(() => {
    if (!!openModal) {
      search();
      // console.log("modal-customers");
    }
  }, [openModal]);

  const handleResize = () => {
    setIsSmallScreen(window.matchMedia("(max-width: 767px)").matches);
  };

  useEffect(() => {
    handleResize(); // Set initial screen size

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array ensures the effect runs once on mount

  return (
    <>
      <Modal
        open={openModal}
        title="เลือกใบส่งของ"
        afterClose={() => handleClose()}
        onCancel={() => setOpenModel(false)}
        maskClosable={false}
        style={{ top: 20 }}
        width={800}
        className="modal-customers"
      >
        <Spin spinning={loading}>
          <Space
            direction="vertical"
            size="middle"
            style={{ display: "flex", position: "relative" }}
          >
            <Card style={{ backgroundColor: "#f0f0f0" }}>
              <Form form={form} layout="vertical" autoComplete="off">
                <Row
                  gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
                  className="m-0"
                >
                  <Col span={24}>
                    <Form.Item label="ค้นหา">
                      <Input
                        suffix={<SearchOutlined />}
                        onChange={(e) => {
                          handleSearch(e.target.value);
                        }}
                        placeholder="ค้นหาใบส่งสินค้า"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
            <Card style={{ minHeight: "60vh" }}>
              <Table
                bordered
                dataSource={deliveryDataWrap}
                columns={column}
                rowKey="dncode"
                pagination={{
                  total: deliveryDataWrap.length,
                  showTotal: (_, range) =>
                    `${range[0]}-${range[1]} of ${deliveryData.length} items`,
                  defaultPageSize: 25,
                  pageSizeOptions: [25, 35, 50, 100],
                }}
                scroll={{ x: "max-content", y: 400 }}
                size="small"
              />
            </Card>
          </Space>
        </Spin>
      </Modal>
    </>
  );
}
