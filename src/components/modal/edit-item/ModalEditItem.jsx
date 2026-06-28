import React from "react";
import {
  Modal,
  Space,
  Button,
  Table,
  Card,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Typography,
} from "antd";
import { formatMoney } from "../../../utils/util";

function ModalEditItem({
  open,
  editingGroup,
  editingItem,
  savingEditItem,
  editItemForm,
  editItemColumns,
  onCancel,
  onSaveEditItem,
  onSelectEditItem,
}) {
  return (
    <Modal
      open={open}
      title={
        editingGroup?.dncode
          ? `แก้ไขรายการใบส่งของ ${editingGroup.dncode}`
          : "แก้ไขรายการสินค้า"
      }
      onCancel={onCancel}
      width={960}
      maskClosable={false}
      footer={
        <Space>
          <Button onClick={onCancel}>ปิด</Button>
          <Button
            type="primary"
            onClick={onSaveEditItem}
            disabled={!editingItem}
            loading={savingEditItem}
          >
            บันทึกการแก้ไข
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card size="small" title="แก้ไขทีละรายการ">
          {editingItem ? (
            <Form form={editItemForm} layout="vertical">
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <Form.Item label="เลขที่ SO">
                    <Input value={editingItem?.socode || ""} readOnly />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="รหัสสินค้า">
                    <Input value={editingItem?.stcode || ""} readOnly />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="ชื่อสินค้า">
                    <Input
                      value={editingItem?.stname || editingItem?.purdetail || ""}
                      readOnly
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="qty"
                    label="จำนวน"
                    rules={[{ required: true, message: "กรุณาระบุจำนวน" }]}
                  >
                    <InputNumber
                      min={0}
                      controls={false}
                      className="width-100 input-40"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="ราคาขาย"
                    rules={[{ required: true, message: "กรุณาระบุราคาขาย" }]}
                  >
                    <InputNumber
                      min={0}
                      controls={false}
                      className="width-100 input-40"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          ) : (
            <Typography.Text type="secondary">
              เลือกรายการที่ต้องการแก้ไขจากตารางด้านบนก่อน
            </Typography.Text>
          )}
        </Card>

        {(editingGroup?.detailRows?.length || 0) >= 10 && (
          <Space style={{ display: "flex", justifyContent: "right" }}>
            <Button onClick={onCancel}>ปิด</Button>
            <Button
              type="primary"
              onClick={onSaveEditItem}
              disabled={!editingItem}
              loading={savingEditItem}
            >
              บันทึกการแก้ไข
            </Button>
          </Space>
        )}
        <Table
          bordered
          size="small"
          pagination={false}
          dataSource={editingGroup?.detailRows || []}
          columns={editItemColumns}
          rowKey="_rowKey"
        />
      </Space>
    </Modal>
  );
}

export default ModalEditItem;
