/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";

import { Modal, Card, Form } from "antd";
import { Row, Col, Space } from "antd";
import { Input } from "antd";
import { useForm } from "antd/es/form/Form";
import Swal from "sweetalert2";

import UserService from "../../../service/User.service";

const userService = UserService();

export default function ModalResetPassword({ show, close, code }) {
  const [form] = useForm();

  const [openModal, setOpenModel] = useState(show);

  const onload = () => {
    // debugger;
    form.setFieldValue("resetcode", code);
  };

  useEffect(() => {
    if (!!openModal) {
      onload();
      // console.log("modal-sample-preparation")
    }
  }, [openModal]);

  const handleSubmit = (v) => {
    form.validateFields().then((value) => {
      
      if (
        form.getFieldValue("resetpassword") ===
        form.getFieldValue("resetpassword2")
      ) {
        const parm = { code:form.getFieldValue("resetcode"),pwd:form.getFieldValue("resetpassword")};
        // form.getFieldValue("resetcode"),
        //     form.getFieldValue("resetpassword")
        userService
          .resetPassword(
            
            parm
          )
          .then(async (res) => {
            let { data } = res.data;

            await Swal.fire({
              title: "<strong>สำเร็จ</strong>",
              html: data.message,
              icon: "success",
            });

            close(false);
          })
          .catch((err) => {
            Swal.fire({
              title: "<strong>ผิดพลาด!</strong>",
              html: err.message,
              icon: "error",
            });
          });
      } else {
        Swal.fire({
          title: "<strong>ผิดพลาด!</strong>",
          html: "password ไม่ตรงกัน",
          icon: "error",
        });
        // alert('password ไม่ตรงกัน')
      }
    });
  };

  return (
    <>
      <Modal
        open={openModal}
        title="แก้ไขรหัสผ่าน"
        width={500}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        onOk={() => {
          handleSubmit();
        }}
        onCancel={() => setOpenModel(false)}
      >
        <Space
          direction="vertical"
          size="middle"
          style={{ display: "flex", position: "relative" }}
        >
          <Card style={{ backgroundColor: "#f0f0f0" }}>
            <Form
              form={form}
              layout="vertical"
              name="form_in_modal"
              initialValues={{ modifier: "public" }}
            >
              <Row gutter={[24, 0]}>
                <Col xs={24} sm={24} md={16} lg={16} xl={24}>
                  <Form.Item
                    name="resetpassword"
                    label="รหัสผ่านใหม่"
                    rules={[
                      { required: true, message: "Please input your data!" },
                    ]}
                  >
                    <Input.Password placeholder="ใส่รหัสผ่านใหม่" />
                  </Form.Item>
                  <Form.Item
                    name="resetpassword2"
                    label="ยืนยีนรหัสผ่านใหม่"
                    rules={[
                      { required: true, message: "Please input your data!" },
                    ]}
                  >
                    <Input.Password placeholder="ยืนยีนรหัสผ่านใหม่" />
                  </Form.Item>
                  <Form.Item name="resetcode">
                    {/* <Input disabled /> */}
                    <Input type="hidden" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Space>
      </Modal>
    </>
  );
}
