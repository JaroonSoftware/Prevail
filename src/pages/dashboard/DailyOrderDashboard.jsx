/* ============================================================================
   Dashboard: ลูกค้าที่ "รับแจ้งเตือนรายงานทุกวัน" — เจ้าไหนยังไม่ออกใบขายสินค้า
   เลือกวันที่นัดส่ง (ค่าเริ่มต้น = วันนี้) · รีเฟรชเองทุก 2 นาที
   ติ๊กลูกค้าที่รับแจ้งเตือนได้ที่หน้าข้อมูลลูกค้า
   ============================================================================ */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Flex, Input, Row, Segmented, Statistic, Table, Tag, Tooltip, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { requestService as api } from "../../service/Request.service";
import DocumentLink from "../../components/DocumentLink";

const STATUS = {
  none: { text: "ยังไม่ออกใบขาย", color: "red" },
  draft: { text: "รอยืนยัน (AI)", color: "orange" },
  done: { text: "ออกใบขายแล้ว", color: "green" },
};

export default function DailyOrderDashboard() {
  const [date, setDate] = useState(dayjs());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("none");
  const [search, setSearch] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get(`/dashboard/daily-orders.php?date=${date.format("YYYY-MM-DD")}`, { ignoreLoading: true });
      setRows(r?.data?.data || []);
      setError(null);
      setUpdatedAt(dayjs());
    } catch (e) {
      setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 120000);
    return () => clearInterval(t);
  }, [load]);

  const count = (s) => rows.filter((r) => r.status === s).length;
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (!q || r.cuscode.toLowerCase().includes(q) || (r.cusname || "").toLowerCase().includes(q))
  ), [rows, filter, q]);

  const columns = [
    { title: "รหัสลูกค้า", dataIndex: "cuscode", width: 120, sorter: (a, b) => a.cuscode.localeCompare(b.cuscode) },
    { title: "ชื่อลูกค้า", dataIndex: "cusname", ellipsis: true },
    { title: "เขตขนส่ง", dataIndex: "county_name", width: 160, render: (v) => v || "-",
      sorter: (a, b) => (a.county_name || "").localeCompare(b.county_name || "") },
    { title: "เที่ยวรถ", dataIndex: "trip", width: 160, render: (v) => v || "-",
      sorter: (a, b) => (a.trip || "").localeCompare(b.trip || "", undefined, { numeric: true }) },
    { title: "สถานะ", dataIndex: "status", width: 150, render: (s) => <Tag color={STATUS[s].color}>{STATUS[s].text}</Tag> },
    { title: "PO ที่ออกแล้ว", dataIndex: "po_count", width: 120, align: "center",
      sorter: (a, b) => a.po_count - b.po_count,
      render: (v, r) => v > 0
        ? <Tooltip title={r.po_list}><span style={{ cursor: "help" }}>{v} ใบ</span></Tooltip>
        : "-" },
    { title: "เลข PO", dataIndex: "po_pairs", width: 300,
      /* เลข PO ลูกค้า (PO ซ้ำแสดงครั้งเดียว) ชี้เมาส์เห็นเลขใบขาย กดเพื่อเปิดใบขายใบแรก
         ใบขายที่ไม่ได้กรอก PO แสดงเลขใบขายแทน */
      render: (v) => {
        if (!v) return "-";
        const byPo = new Map();
        v.split("|").forEach((pair) => {
          const k = pair.lastIndexOf("=");
          const po = pair.slice(0, k), so = pair.slice(k + 1);
          const key = po || "__no_po__" + so;
          if (!byPo.has(key)) byPo.set(key, { po, sos: [] });
          byPo.get(key).sos.push(so);
        });
        return [...byPo.values()].map(({ po, sos }) => (
          <Tooltip key={po + sos[0]} title={"ใบขาย: " + sos.join(", ")}>
            <span style={{ marginRight: 10, whiteSpace: "nowrap" }}>
              <DocumentLink type="socode" code={sos[0]}>{po || `${sos[0]} (ไม่มี PO)`}</DocumentLink>
            </span>
          </Tooltip>
        ));
      } },
  ];

  const stat = (key, title, color) => (
    <Col xs={12} md={8}>
      <Card size="small" hoverable onClick={() => setFilter(key)}
        style={{ borderColor: filter === key ? color : undefined, cursor: "pointer" }}>
        <Statistic title={title} value={key === "all" ? rows.length : count(key)} valueStyle={{ color }} />
      </Card>
    </Col>
  );

  return (
    <Flex vertical gap={12} style={{ padding: 8 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Typography.Title level={3} className="m-0 !text-zinc-800">ลูกค้าที่ยังไม่ออกใบขายสินค้า</Typography.Title>
        <Flex gap={8} wrap="wrap" align="center">
          <span>วันที่นัดส่ง</span>
          <DatePicker value={date} format="DD/MM/YYYY" allowClear={false} onChange={(d) => d && setDate(d)} />
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>รีเฟรช</Button>
        </Flex>
      </Flex>
      <Typography.Text type="secondary">
        แสดงเฉพาะลูกค้าที่ติ๊ก "รับแจ้งเตือนรายงานทุกวัน" ในหน้าข้อมูลลูกค้า · นับใบขายตามวันที่นัดส่ง (ไม่นับใบที่ยกเลิก)
        {updatedAt && ` · อัปเดต ${updatedAt.format("HH:mm")} (รีเฟรชเองทุก 2 นาที)`}
      </Typography.Text>
      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[12, 12]}>
        {stat("none", "ยังไม่ออกใบขาย", "#cf1322")}
        {stat("draft", "รอยืนยัน (AI)", "#d46b08")}
        {stat("done", "ออกใบขายแล้ว", "#389e0d")}
      </Row>

      <Card size="small">
        <Flex justify="space-between" wrap="wrap" gap={8} style={{ marginBottom: 8 }}>
          <Segmented value={filter} onChange={setFilter} options={[
            { value: "none", label: `ยังไม่ออก (${count("none")})` },
            { value: "draft", label: `รอยืนยัน (${count("draft")})` },
            { value: "done", label: `ออกแล้ว (${count("done")})` },
          ]} />
          <Input allowClear placeholder="ค้นหารหัส/ชื่อลูกค้า" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
        </Flex>
        <Table rowKey="cuscode" size="small" loading={loading} columns={columns} dataSource={shown}
          pagination={{ pageSize: 50, showSizeChanger: true }} scroll={{ x: 900 }} />
      </Card>
    </Flex>
  );
}
