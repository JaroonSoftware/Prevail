import { Table as ManagedTable } from "antd";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Card,
  Checkbox,
  Button,
  Space,
  Flex,
  Typography,
  message,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Alert,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";

import PermissionService from "../../service/Permission.service";
import { ACTION_LABEL } from "../../constant/permission";
import { usePermission } from "../../store/context/permission-context";

const permissionService = PermissionService();
const ACTIONS = ["view", "add", "edit", "delete"];

const PermissionAccess = () => {
  const { reload: reloadMyPermission } = usePermission();

  const [menus, setMenus] = useState([]);
  const [roles, setRoles] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roleForm] = Form.useForm();
  const [openRole, setOpenRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  /* รายชื่อผู้ใช้ในตำแหน่ง — เปิดจากการกดตัวเลขในคอลัมน์ "จำนวนผู้ใช้" */
  const [userModal, setUserModal] = useState({ open: false, loading: false, role: null, users: [] });

  const showRoleUsers = (role) => {
    setUserModal({ open: true, loading: true, role, users: [] });
    permissionService
      .roleUsers(role.role_code)
      .then((res) => {
        const d = res.data?.data || {};
        setUserModal({ open: true, loading: false, role: d.role || role, users: d.users || [] });
      })
      .catch((err) => {
        message.error(err?.response?.data?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
        setUserModal((s) => ({ ...s, open: false, loading: false }));
      });
  };

  /* ตัวเลขจำนวนผู้ใช้ที่กดดูรายชื่อได้ */
  const UserCountLink = ({ role, suffix = "" }) => {
    const count = Number(role.user_count || 0);
    if (count === 0) return <Typography.Text type="secondary">{`0${suffix}`}</Typography.Text>;
    return (
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: "auto" }}
        onClick={() => showRoleUsers(role)}
      >
        {`${count}${suffix}`}
      </Button>
    );
  };

  const loadData = () => {
    permissionService
      .list()
      .then((res) => {
        const d = res.data?.data || {};
        setMenus(d.menus || []);
        setRoles(d.roles || []);
        setMatrix(d.matrix || {});
        setDirty(false);
      })
      .catch((err) => message.error(err?.response?.data?.message || "โหลดข้อมูลสิทธิ์ไม่สำเร็จ"));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggle = (roleCode, menuKey, action, checked) => {
    setMatrix((prev) => {
      const role = { ...(prev[roleCode] || {}) };
      const cur = { ...(role[menuKey] || {}) };

      cur[action] = checked;

      /* ปิดสิทธิ์เข้าดู = ปิดทุกอย่างในเมนูนั้น / ติ๊กอย่างอื่น = เปิดสิทธิ์เข้าดูให้อัตโนมัติ */
      if (action === "view" && !checked) {
        ACTIONS.forEach((a) => (cur[a] = false));
      } else if (action !== "view" && checked) {
        cur.view = true;
      }

      role[menuKey] = cur;
      return { ...prev, [roleCode]: role };
    });
    setDirty(true);
  };

  const toggleWholeMenu = (roleCode, menu, checked) => {
    setMatrix((prev) => {
      const role = { ...(prev[roleCode] || {}) };
      const cur = {};
      ACTIONS.forEach((a) => (cur[a] = checked && menu.actions.includes(a)));
      role[menu.key] = cur;
      return { ...prev, [roleCode]: role };
    });
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionService.saveMatrix(matrix);
      message.success("บันทึกสิทธิ์สำเร็จ");
      setDirty(false);
      reloadMyPermission();
      loadData();
    } catch (err) {
      message.error(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- จัดการตำแหน่ง ---------- */
  const handleAddRole = () => {
    roleForm.resetFields();
    roleForm.setFieldsValue({ is_admin: "N", so_region_only: "N", seq: 99, status: "Y" });
    setEditingRole(null);
    setOpenRole(true);
  };

  const handleEditRole = (role) => {
    roleForm.resetFields();
    roleForm.setFieldsValue({ ...role, so_region_only: role.so_region_only || "N" });
    setEditingRole(role);
    setOpenRole(true);
  };

  const handleSaveRole = async () => {
    try {
      const v = await roleForm.validateFields();
      if (editingRole) await permissionService.updateRole({ ...v, role_code: editingRole.role_code });
      else await permissionService.createRole(v);

      message.success("บันทึกตำแหน่งสำเร็จ");
      setOpenRole(false);
      loadData();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    }
  };

  const handleDeleteRole = (role) => {
    Modal.confirm({
      title: `ลบตำแหน่ง ${role.role_name}`,
      icon: <ExclamationCircleFilled />,
      content: "ลบได้เฉพาะตำแหน่งที่ไม่มีผู้ใช้ผูกอยู่ ต้องการลบหรือไม่?",
      okText: "ลบ",
      cancelText: "ปิด",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await permissionService.deleteRole(role.role_code);
          message.success("ลบตำแหน่งสำเร็จ");
          loadData();
        } catch (err) {
          message.error(err?.response?.data?.message || "ลบไม่สำเร็จ");
        }
      },
    });
  };

  /* ---------- ตารางสิทธิ์ ---------- */
  const permissionColumns = [
    {
      title: "เมนู",
      dataIndex: "title",
      key: "title",
      width: 220,
      fixed: "left",
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {r.group}
          </Typography.Text>
        </div>
      ),
    },
    ...roles.map((role) => ({
      title: (
        <Flex vertical align="center" gap={2}>
          <span>{role.role_name}</span>
          {role.is_admin === "Y" ? (
            <Tag color="purple" style={{ marginInlineEnd: 0 }}>
              สิทธิ์เต็ม
            </Tag>
          ) : (
            <UserCountLink role={role} suffix=" ผู้ใช้" />
          )}
        </Flex>
      ),
      key: role.role_code,
      align: "center",
      width: 190,
      render: (_, menu) => {
        const cur = matrix?.[role.role_code]?.[menu.key] || {};
        const isAdmin = role.is_admin === "Y";
        const allChecked = menu.actions.every((a) => cur[a]);

        return (
          <Flex vertical align="start" gap={2} style={{ paddingInlineStart: 16 }}>
            <Checkbox
              disabled={isAdmin || menu.admin_only}
              checked={isAdmin || allChecked}
              indeterminate={!isAdmin && !allChecked && menu.actions.some((a) => cur[a])}
              onChange={(e) => toggleWholeMenu(role.role_code, menu, e.target.checked)}
            >
              <b>ทั้งหมด</b>
            </Checkbox>
            {menu.actions.map((a) => (
              <Checkbox
                key={a}
                disabled={isAdmin || menu.admin_only}
                checked={isAdmin || !!cur[a]}
                onChange={(e) => toggle(role.role_code, menu.key, a, e.target.checked)}
              >
                {ACTION_LABEL[a]}
              </Checkbox>
            ))}
          </Flex>
        );
      },
    })),
  ];

  const roleColumns = [
    { title: "รหัสตำแหน่ง", dataIndex: "role_code", key: "role_code", width: 180 },
    { title: "ชื่อตำแหน่ง", dataIndex: "role_name", key: "role_name" },
    {
      title: "สิทธิ์เต็ม",
      dataIndex: "is_admin",
      key: "is_admin",
      width: 100,
      align: "center",
      render: (v) => (v === "Y" ? <Tag color="purple">ใช่</Tag> : <Tag>ไม่</Tag>),
    },
    
    {
      title: "จำนวนผู้ใช้",
      dataIndex: "user_count",
      key: "user_count",
      width: 110,
      align: "right",
      render: (_, r) => <UserCountLink role={r} suffix=" คน" />,
    },
    { title: "ลำดับ", dataIndex: "seq", key: "seq", width: 80, align: "right" },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v) => <Tag color={v === "Y" ? "green" : "red"}>{v === "Y" ? "ใช้งาน" : "ปิด"}</Tag>,
    },
    {
      title: "จัดการ",
      key: "op",
      width: 110,
      render: (_, r) => (
        <Space>
          <Tooltip title="แก้ไขตำแหน่ง">
            <Button size="small" className="bn-primary-outline" icon={<EditOutlined />} onClick={() => handleEditRole(r)} />
          </Tooltip>
          <Tooltip title="ลบตำแหน่ง">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={Number(r.user_count) > 0}
              onClick={() => handleDeleteRole(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="layout-content px-3 sm:px-5 md:px-5">
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Alert type="warning" showIcon message="อยู่ระหว่างเตรียมเปิดใช้ระบบสิทธิ์" description="ตารางนี้บันทึกค่ากลุ่มผู้ใช้ได้หลังติดตั้งฐานข้อมูล แต่ยังไม่เปลี่ยนสิทธิ์เข้าใช้งานของหน้าเดิมจนกว่าจะเปิดใช้การตรวจสิทธิ์ทั้งระบบ" />
        <Card>
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }} wrap="wrap" gap={8}>
            <Typography.Title level={3} className="m-0">
              สิทธิ์การเข้าถึงระบบ
            </Typography.Title>
            <Space>
              <Button size="small" className="bn-action" icon={<ReloadOutlined />} onClick={loadData}>
                โหลดใหม่
              </Button>
              <Button
                type="primary"
                size="small"
                className="bn-action"
                icon={<SaveOutlined />}
                loading={saving}
                disabled={!dirty}
                onClick={handleSave}
              >
                บันทึกสิทธิ์
              </Button>
            </Space>
          </Flex>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="สิทธิ์ผูกกับตำแหน่งของผู้ใช้ (ช่อง “ประเภท” ในหน้าผู้ใช้งาน) — เปลี่ยนตรงนี้แล้วมีผลกับทุกคนในตำแหน่งนั้นทันทีที่เข้าระบบใหม่"
          />

          <ManagedTable
            size="small"
            rowKey="key"
            columns={permissionColumns}
            dataSource={menus}
            pagination={false}
            // Keep role names visible while scrolling through the permission matrix.
            scroll={{ x: "max-content", y: "max(240px, calc(100vh - 320px))" }}
            bordered
          />
        </Card>

        <Card>
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <Typography.Title level={4} className="m-0">
              ตำแหน่งในระบบ
            </Typography.Title>
            <Button
              size="small"
              className="bn-action bn-primary-outline"
              icon={<PlusOutlined />}
              onClick={handleAddRole}
            >
              เพิ่มตำแหน่ง
            </Button>
          </Flex>

          <ManagedTable
            size="small"
            rowKey="role_code"
            columns={roleColumns}
            dataSource={roles}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </Card>
      </Space>

      <Modal
        title={`ผู้ใช้ในตำแหน่ง ${userModal.role?.role_name || ""}`}
        open={userModal.open}
        onCancel={() => setUserModal((s) => ({ ...s, open: false }))}
        footer={null}
        width={900}
        destroyOnClose
      >
        <ManagedTable
          size="small"
          rowKey={(r) => r.userid || r.username}
          loading={userModal.loading}
          dataSource={userModal.users}
          pagination={false}
          scroll={{ x: "max-content", y: 380 }}
          locale={{ emptyText: "ไม่มีผู้ใช้ในตำแหน่งนี้" }}
          columns={[
            { title: "ชื่อผู้ใช้", dataIndex: "username", key: "username", width: 150 },
            {
              title: "ชื่อ - นามสกุล",
              key: "fullname",
              render: (_, r) => `${r.firstname || ""} ${r.lastname || ""}`.trim() || "-",
            },
            { title: "เบอร์โทร", dataIndex: "tel", key: "tel", width: 130, render: (v) => v || "-" },
            { title: "อีเมล", dataIndex: "email", key: "email", width: 200, render: (v) => v || "-" },
            {
              title: "สถานะ",
              dataIndex: "active_status",
              key: "active_status",
              width: 100,
              align: "center",
              render: (v) =>
                v === "N" ? <Tag color="red">ปิดใช้งาน</Tag> : <Tag color="green">ใช้งาน</Tag>,
            },
          ]}
        />
      </Modal>

      <Modal
        title={editingRole ? `แก้ไขตำแหน่ง ${editingRole.role_code}` : "เพิ่มตำแหน่ง"}
        open={openRole}
        onCancel={() => setOpenRole(false)}
        onOk={handleSaveRole}
        okText="บันทึก"
        cancelText="ปิด"
        destroyOnClose
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item
            label="รหัสตำแหน่ง (ต้องตรงกับค่าในช่องประเภทของผู้ใช้)"
            name="role_code"
            rules={[{ required: true, message: "กรุณาระบุรหัสตำแหน่ง" }]}
          >
            <Input placeholder="เช่น ฝ่ายบัญชี" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item label="ชื่อตำแหน่ง" name="role_name" rules={[{ required: true, message: "กรุณาระบุชื่อ" }]}>
            <Input placeholder="ชื่อที่แสดงในระบบ" />
          </Form.Item>
          <Form.Item label="ให้สิทธิ์เต็มทุกเมนู (ผู้ดูแลระบบ)" name="is_admin">
            <Select
              options={[
                { label: "ไม่ — กำหนดสิทธิ์เอง", value: "N" },
                { label: "ใช่ — เข้าได้ทุกเมนู", value: "Y" },
              ]}
            />
          </Form.Item>
          
          <Form.Item label="ลำดับการแสดง" name="seq">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          {editingRole && (
            <Form.Item label="สถานะ" name="status">
              <Select
                options={[
                  { label: "ใช้งาน", value: "Y" },
                  { label: "ปิดใช้งาน", value: "N" },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionAccess;
