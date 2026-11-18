/* ============================================================================
   หน้าดูข้อมูลสินค้า (อ่านอย่างเดียว) — /items/view/:code
   แสดงข้อมูลสินค้า ชื่อย่อย ราคา ขนาดต่อถุง และผู้สร้าง/ผู้แก้ไขล่าสุด
   ============================================================================ */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Descriptions, Flex, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Itemservice from "../../service/Items.Service";
import OptionService from "../../service/Options.service";

const itemservice = Itemservice();
const opService = OptionService();

const money = (v) => (v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const when = (d) => (d && dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY HH:mm") : "");

export default function ItemView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    itemservice.get(code)
      .then((res) => {
        if (!active) return;
        const data = res?.data?.data;
        if (!data) setError("ไม่พบสินค้า " + code);
        else setItem(data);
      })
      .catch(() => active && setError("โหลดข้อมูลสินค้าไม่สำเร็จ"));
    opService.optionsCatalogGroup?.().then((r) => active && setGroups(r?.data?.data || [])).catch(() => {});
    return () => { active = false; };
  }, [code]);

  const goEdit = () => navigate("/items/manage/edit", {
    state: { config: { title: "แก้ไขข้อมูลสินค้า", action: "edit", code: item?.stcode } },
  });

  if (error) return <Alert type="error" showIcon message={error} style={{ margin: 16 }} />;
  if (!item) return <Flex justify="center" style={{ padding: 60 }}><Spin /></Flex>;

  const group = groups.find((g) => Number(g.group_id) === Number(item.catalog_group_id));
  const aliases = (item.aliases || []).filter(Boolean);

  return (
    <Flex vertical gap={12} style={{ padding: 8 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/items")}>กลับ</Button>
        <Button type="primary" icon={<EditOutlined />} onClick={goEdit}>แก้ไข</Button>
      </Flex>

      <Card title={<Typography.Title level={4} className="m-0">{item.stcode} · {item.stname}</Typography.Title>}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2, lg: 3 }}>
          <Descriptions.Item label="รหัสสินค้า">{item.stcode}</Descriptions.Item>
          <Descriptions.Item label="ชื่อสินค้า">{item.stname || "-"}</Descriptions.Item>
          <Descriptions.Item label="ชื่อสินค้า (อังกฤษ)">{item.stnameEN || "-"}</Descriptions.Item>
          <Descriptions.Item label="ชื่อย่อย" span={3}>
            {aliases.length ? aliases.map((a) => <Tag key={a}>{a}</Tag>) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="ประเภทสินค้า">{item.typename || item.typecode || "-"}</Descriptions.Item>
          <Descriptions.Item label="หมวดแคตตาล็อก">{group?.group_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="หน่วยสินค้า">{item.unit || "-"}</Descriptions.Item>
          <Descriptions.Item label="ราคาขาย">{money(item.price)}</Descriptions.Item>
          <Descriptions.Item label="ราคาซื้อ">{money(item.buyprice)}</Descriptions.Item>
          <Descriptions.Item label="VAT (%)">{item.vat ?? 0}</Descriptions.Item>
          <Descriptions.Item label="ขนาดต่อถุง">
            {Number(item.packing_weight) > 0 ? `${Number(item.packing_weight)} ${item.unit || ""}/ถุง` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="สถานะ">
            {item.active_status === "Y" ? <Badge status="success" text="เปิดการใช้งาน" /> : <Badge status="error" text="ปิดการใช้งาน" />}
          </Descriptions.Item>
          <Descriptions.Item label="หมายเหตุ" span={3}>{item.remark || "-"}</Descriptions.Item>
          <Descriptions.Item label="ผู้สร้าง">
            {item.created_name || "-"} {when(item.created_date) && <Typography.Text type="secondary">· {when(item.created_date)}</Typography.Text>}
          </Descriptions.Item>
          <Descriptions.Item label="ผู้แก้ไขล่าสุด" span={2}>
            {item.updated_name || "-"} {when(item.updated_date) && <Typography.Text type="secondary">· {when(item.updated_date)}</Typography.Text>}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Flex>
  );
}
