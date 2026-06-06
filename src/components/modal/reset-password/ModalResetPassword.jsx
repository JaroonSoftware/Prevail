import { useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import UserService from "../../../service/User.service";

const userService = UserService();

const ModalResetPassword = ({ open, onClose, userid }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await userService.resetPassword({ code: userid, pwd: values.newPassword });
      message.success("เปลี่ยนรหัสผ่านสำเร็จ");
      form.resetFields();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      const msg = err?.response?.data?.message;
      message.error(msg || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8, color: "#1677ff" }} />
          เปลี่ยนรหัสผ่าน
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          ยกเลิก
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          บันทึก
        </Button>,
      ]}
      width={420}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="รหัสผ่านใหม่"
          name="newPassword"
          rules={[
            { required: true, message: "กรุณากรอกรหัสผ่านใหม่" },
            { min: 1, message: "กรุณากรอกรหัสผ่าน" },
          ]}
        >
          <Input.Password placeholder="กรอกรหัสผ่านใหม่" />
        </Form.Item>

        <Form.Item
          label="ยืนยันรหัสผ่านใหม่"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "กรุณายืนยันรหัสผ่าน" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="ยืนยันรหัสผ่านใหม่" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalResetPassword;
