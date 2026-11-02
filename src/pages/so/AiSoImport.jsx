/* ============================================================================
   PO ลูกค้า -> ร่างใบขายสินค้าด้วย AI
   อัปโหลด PO / ใบขอซื้อ (PDF หรือรูป หลายไฟล์ได้) -> AI อ่าน -> สร้างใบขายสินค้า
   สถานะ "รอยืนยัน" (1 ใบต่อ เลขที่ PO + ครัว/จุดส่ง + วันส่ง)
   รายการที่ไม่ชัด ระบบไม่เดา ให้ไปจับคู่เองในหน้าแก้ไขใบขาย แล้วกด "ยืนยันใบขายสินค้า"
   ============================================================================ */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Flex, Select, Space, Table, Tag, Typography, Upload, message } from "antd";
import { InboxOutlined, LoadingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import AiSoImportService from "../../service/AiSoImport.service";
import OptionService from "../../service/Options.service";
import { ButtonBack } from "../../components/button";
import { formatMoney } from "../../utils/util";

const aiService = AiSoImportService();
const opService = OptionService();

const editConfig = (socode) => ({
  title: "ตรวจใบขายสินค้าจาก PO (AI)", textOk: null, textCancel: null, action: "edit", code: socode,
});

function AiSoImport() {
  const navigate = useNavigate();
  /* ผลของแต่ละไฟล์ [{ uid, name, state: reading|need_customer|done|error, data, error }] */
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    opService
      .optionsCustomer()
      .then((r) => setCustomers(r?.data?.data || []))
      .catch(() => {});
  }, []);

  const patchJob = (uid, patch) => setJobs((s) => s.map((j) => (j.uid === uid ? { ...j, ...patch } : j)));

  /* อ่านทีละไฟล์ตามลำดับ (กันเรียก AI พร้อมกันหลายไฟล์จนโดนจำกัดความถี่) */
  const queue = React.useRef(Promise.resolve());
  const handleFile = (file) => {
    const uid = file.uid;
    setJobs((s) => [{ uid, name: file.name, state: "reading" }, ...s]);
    queue.current = queue.current.then(async () => {
      try {
        const res = await aiService.importFile(file);
        const data = res?.data?.data;
        patchJob(uid, { state: data?.need_customer ? "need_customer" : "done", data });
      } catch (err) {
        patchJob(uid, { state: "error", error: err?.response?.data?.message || err?.message || "อ่านไฟล์ไม่สำเร็จ" });
      }
    });
    return false; // ไม่ให้ antd อัปโหลดเอง
  };

  const handlePickCustomer = async (job, cuscode) => {
    patchJob(job.uid, { state: "reading" });
    try {
      const res = await aiService.importWithCustomer(job.data.import_id, cuscode);
      patchJob(job.uid, { state: "done", data: res?.data?.data });
    } catch (err) {
      patchJob(job.uid, { state: "need_customer", error: err?.response?.data?.message || "สร้างใบขายสินค้าไม่สำเร็จ" });
    }
  };

  const openSO = (socode) =>
    navigate("/sales-order/manage/edit", { state: { config: editConfig(socode) } });

  const soColumns = [
    { title: "เลขที่ใบขาย", dataIndex: "socode", width: 130,
      render: (v) => <Typography.Link onClick={() => openSO(v)}>{v}</Typography.Link> },
    { title: "PO ลูกค้า", dataIndex: "customer_po", width: 150 },
    { title: "ห้องครัว / จุดส่ง", dataIndex: "del_room" },
    { title: "วันส่ง", dataIndex: "deldate", width: 110, render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-") },
    { title: "รายการ", dataIndex: "lines", width: 80, align: "right" },
    { title: "รอจับคู่", dataIndex: "pending", width: 90, align: "right",
      render: (v) => (v > 0 ? <Tag color="volcano">{v}</Tag> : <Tag color="green">0</Tag>) },
    { title: "ยอดเบื้องต้น", dataIndex: "total_price", width: 120, align: "right", render: (v) => formatMoney(Number(v || 0), 2, 2) },
    { title: "", key: "act", width: 110,
      render: (_, r) => <Button size="small" type="primary" onClick={() => openSO(r.socode)}>ตรวจ / ยืนยัน</Button> },
  ];

  const cusOptions = customers.map((c) => ({
    value: c.cuscode,
    label: `${c.cuscode} - ${[c.prename, c.cusname].filter(Boolean).join(" ")}`,
  }));

  return (
    <div className="so-ai-import" style={{ padding: 8 }}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} className="m-0 !text-zinc-800">
            สร้างใบขายสินค้าจาก PO ลูกค้า (AI)
          </Typography.Title>
          <ButtonBack target="/sales-order" />
        </Flex>

        <Alert
          type="info"
          showIcon
          message="อัปโหลด PO / ใบขอซื้อของลูกค้า (PDF หรือรูปถ่าย) ระบบจะสร้างใบขายสินค้าสถานะ “รอยืนยัน” ให้"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>1 ไฟล์มีหลายใบสั่ง/หลายครัวได้ — แยกเป็นใบขายสินค้า 1 ใบต่อ PO + ครัว + วันส่ง</li>
              <li>ราคาใช้ตามแคตตาล็อกของลูกค้า (ถ้าไม่มีในแคตตาล็อกจึงใช้ราคาใน PO)</li>
              <li>รายการที่อ่านไม่ชัด จับคู่สินค้าไม่มั่นใจ หรือหน่วยไม่ตรง (เช่น ขีด, Pack 800 G) จะ “รอจับคู่” ให้ตรวจเอง</li>
              <li>ใบที่ยังไม่กดยืนยัน จะยังไม่เข้าใบจัดสินค้า ใบส่งของ และรายงานเตรียมของ</li>
            </ul>
          }
        />

        <Upload.Dragger multiple accept=".pdf,image/*" showUploadList={false} beforeUpload={handleFile}>
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">คลิกหรือลากไฟล์ PO มาวางที่นี่ (เลือกได้หลายไฟล์)</p>
          <p className="ant-upload-hint">PDF หลายหน้าอาจใช้เวลาอ่าน 1-3 นาที</p>
        </Upload.Dragger>

        {jobs.map((job) => (
          <Card key={job.uid} size="small" title={job.name}
            extra={
              job.state === "reading" ? <Tag icon={<LoadingOutlined />} color="processing">AI กำลังอ่าน...</Tag>
              : job.state === "done" ? <Tag color="green">สร้างแล้ว</Tag>
              : job.state === "need_customer" ? <Tag color="orange">เลือกลูกค้า</Tag>
              : <Tag color="red">ไม่สำเร็จ</Tag>
            }>
            {job.state === "error" && <Alert type="error" showIcon message={job.error} />}

            {job.state === "need_customer" && (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Alert type="warning" showIcon
                  message={`หาลูกค้าในระบบไม่เจอ: “${job.data?.document?.customer?.name || "ไม่ระบุชื่อ"}” — เลือกลูกค้า แล้วระบบจะจำชื่อนี้ไว้ใช้ครั้งหน้า`}
                  description={job.error || `พบ ${job.data?.document?.orders?.length || 0} ใบสั่ง`} />
                {!!job.data?.candidates?.length && (
                  <Space wrap>
                    <span>ชื่อใกล้เคียง:</span>
                    {job.data.candidates.map((c) => (
                      <Button key={c.cuscode} size="small" onClick={() => handlePickCustomer(job, c.cuscode)}>
                        {c.cuscode} - {c.cusname}
                      </Button>
                    ))}
                  </Space>
                )}
                <Select showSearch placeholder="ค้นหาลูกค้า" style={{ width: 420, maxWidth: "100%" }}
                  options={cusOptions} optionFilterProp="label"
                  onChange={(v) => handlePickCustomer(job, v)} />
              </Space>
            )}

            {job.state === "done" && (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Typography.Text>
                  ลูกค้า: <b>{job.data?.customer?.cuscode} - {job.data?.customer?.cusname}</b>
                  {job.data?.mock && <Tag color="purple" style={{ marginLeft: 8 }}>โหมดจำลอง</Tag>}
                </Typography.Text>
                {job.data?.document?.notes && <Alert type="warning" showIcon message={job.data.document.notes} />}
                <Table size="small" rowKey="socode" pagination={false}
                  columns={soColumns} dataSource={job.data?.sales_orders || []} />
              </Space>
            )}
          </Card>
        ))}
      </Space>
    </div>
  );
}

export default AiSoImport;
